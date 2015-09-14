.PHONY: all
all: emoji.js

.PHONY: dependencies
dependencies:
	npm install

# Edit this to a path including node_modules if jison is installed locally
JISON = node node_modules/jison/lib/jison.js

emoji.js: emoji.jison
	$(JISON) emoji.jison
