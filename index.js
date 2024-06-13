'use strict';

var postcss = require('postcss');
var objectAssign = require('object-assign');
var { createPropListMatcher } = require('./src/prop-list-matcher');
var { getUnitRegexp } = require('./src/pixel-unit-regexp');

var defaults = {
  unitToConvert: 'px', // 需要转换的单位
  viewportUnit: 'vw', // 转换后的单位
  fontViewportUnit: 'vw',  // 字体使用的视口单位
  viewportWidth: 750, // 标准视图宽度
  unitPrecision: 5, // 转换后保留的精度
  minPixelValue: 1, // 最小转换数值
  selectorBlackList: [], // 选择器黑名单列表
  propList: ['*'], // 能转换的属性列表；*代表所有
  mediaQuery: false, // 媒体查询里的单位是否需要转换
  replace: true, // 是否直接更换属性，不添加备用属性
  landscape: false, // 是否添加
  landscapeUnit: 'vw', // 横屏时使用的单位
  landscapeWidth: 425 // 横屏宽度
};

var ignoreNextComment = 'px-to-viewport-ignore-next';
var ignorePrevComment = 'px-to-viewport-ignore';

const plugin = function (options) {
  var opts = objectAssign({}, defaults, options);

  checkRegExpOrArray(opts, 'exclude');
  checkRegExpOrArray(opts, 'include');

  var pxRegex = getUnitRegexp(opts.unitToConvert);
  var satisfyPropList = createPropListMatcher(opts.propList);
  var landscapeRules = [];

  return {
    postcssPlugin: 'xy-postcss-px-to-viewport',
    prepare(result) {
      var root = result.root
      root.walkRules((rule) => {
        var file = rule.source && rule.source.input.file;
        if (opts.include && file) {
          if (Object.prototype.toString.call(opts.include) === '[object RegExp]') {
            if (!opts.include.test(file)) return;
          } else if (Object.prototype.toString.call(opts.include) === '[object Array]') {
            var flag = false;
            for (var i = 0; i < opts.include.length; i++) {
              if (opts.include[i].test(file)) {
                flag = true;
                break;
              }
            }
            if (!flag) return;
          }
        }
    
        if (opts.exclude && file) {
          if (Object.prototype.toString.call(opts.exclude) === '[object RegExp]') {
            if (opts.exclude.test(file)) return;
          } else if (Object.prototype.toString.call(opts.exclude) === '[object Array]') {
            for (var i = 0; i < opts.exclude.length; i++) {
              if (opts.exclude[i].test(file)) return;
            }
          }
        }
    
        if (blacklistedSelector(opts.selectorBlackList, rule.selector)) return;
    
        if (opts.landscape && !rule.parent.params) {
          var landscapeRule = rule.clone().removeAll();
    
          rule.walkDecls(function(decl) {
            if (decl.value.indexOf(opts.unitToConvert) === -1) return;
            if (!satisfyPropList(decl.prop)) return;
    
            landscapeRule.append(decl.clone({
              value: decl.value.replace(pxRegex, createPxReplace(opts, opts.landscapeUnit, opts.landscapeWidth))
            }));
          });
    
          if (landscapeRule.nodes.length > 0) {
            landscapeRules.push(landscapeRule);
          }
        }
    
        if (!validateParams(rule.parent.params, opts.mediaQuery)) return;
    
        rule.walkDecls(function(decl, i) {
          if (decl.value.indexOf(opts.unitToConvert) === -1) return;
          if (!satisfyPropList(decl.prop)) return;
    
          var prev = decl.prev();
          // prev declaration is ignore conversion comment at same line
          if (prev && prev.type === 'comment' && prev.text === ignoreNextComment) {
            // remove comment
            prev.remove();
            return;
          }
          var next = decl.next();
          // next declaration is ignore conversion comment at same line
          if (next && next.type === 'comment' && next.text === ignorePrevComment) {
            if (/\n/.test(next.raws.before)) {
              result.warn('Unexpected comment /* ' + ignorePrevComment + ' */ must be after declaration at same line.', { node: next });
            } else {
              // remove comment
              next.remove();
              return;
            }
          }
    
          var unit;
          var size;
          var params = rule.parent.params;
    
          if (opts.landscape && params && params.indexOf('landscape') !== -1) {
            unit = opts.landscapeUnit;
            size = opts.landscapeWidth;
          } else {
            unit = getUnit(decl.prop, opts);
            size = opts.viewportWidth;
          }
    
          var value = decl.value.replace(pxRegex, createPxReplace(opts, unit, size));
    
          if (declarationExists(decl.parent, decl.prop, value)) return;
    
          if (opts.replace) {
            decl.value = value;
          } else {
            decl.parent.insertAfter(i, decl.clone({ value: value }));
          }
        });
      })

      if (landscapeRules.length > 0) {
        let landscapeRoot = new postcss.AtRule({
          params: "(orientation: landscape)",
          name: "media",
        });
        landscapeRules.forEach((rule) => landscapeRoot.append(rule));
        root.append(landscapeRoot);
      }
    },
  }
};

plugin.postcss = true
module.exports = plugin

function getUnit(prop, opts) {
  return prop.indexOf('font') === -1 ? opts.viewportUnit : opts.fontViewportUnit;
}

function createPxReplace(opts, viewportUnit, viewportSize) {
  return function (m, $1) {
    if (!$1) return m;
    var pixels = parseFloat($1);
    if (pixels <= opts.minPixelValue) return m;
    var parsedVal = toFixed((pixels / viewportSize * 100), opts.unitPrecision);
    return parsedVal === 0 ? '0' : parsedVal + viewportUnit;
  };
}

function checkRegExpOrArray(options, optionName) {
  var option = options[optionName];
  if (!option) return;
  if (Object.prototype.toString.call(option) === '[object RegExp]') return;
  if (Object.prototype.toString.call(option) === '[object Array]') {
    var bad = false;
    for (var i = 0; i < option.length; i++) {
      if (Object.prototype.toString.call(option[i]) !== '[object RegExp]') {
        bad = true;
        break;
      }
    }
    if (!bad) return;
  }
  throw new Error('options.' + optionName + ' should be RegExp or Array of RegExp.');
}

function toFixed(number, precision) {
  var multiplier = Math.pow(10, precision + 1),
    wholeNumber = Math.floor(number * multiplier);
  return Math.round(wholeNumber / 10) * 10 / multiplier;
}

function blacklistedSelector(blacklist, selector) {
  if (typeof selector !== 'string') return;
  return blacklist.some(function (regex) {
    if (typeof regex === 'string') return selector.indexOf(regex) !== -1;
    return selector.match(regex);
  });
}

function declarationExists(decls, prop, value) {
  return decls.some(function (decl) {
      return (decl.prop === prop && decl.value === value);
  });
}

function validateParams(params, mediaQuery) {
  return !params || (params && mediaQuery);
}
