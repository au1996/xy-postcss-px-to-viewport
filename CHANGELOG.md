# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2022-10-26

### Added

- `include` (Regexp or Array of Regexp) If `include` is set, only matching files will be converted,
  for example, only files under `src/mobile/` (`include: /\/src\/mobile\//`)
  - If the value is regexp, the matching file will be included, otherwise it will be excluded.
  - If value is array, the elements of the array are regexp.
