# jQuery-match

This library implements a memory matching game where players need to find pairs of matching elements within a grid layout.

## Installation

Import directly in html file.

``` html
<!-- HTML -->

<link href="path/jQuery-match/match.css" rel="stylesheet">
<script src="path/jQuery-match/match.js"></script>
```

## Usage

### Library settings

``` bash
# Edit default style
vi path/jQuery-match/match.css

# Edit default setting
vi path/jQuery-match/match.js
```

### How to use

``` html
<!-- HTML -->

<!-- Add data attribute "WKMATCH" to your game container -->
<div data-game="WKMATCH"></div>
```

``` javascript
<!-- JavaScript -->

// Initialize the match game
$('[data-game="WKMATCH"]').WKMatch();
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
