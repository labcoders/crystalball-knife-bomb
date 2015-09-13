.PHONY: all
all: emoji.js

# Edit this to a path including node_modules if jison is installed locally
JISON = jison

emoji.js: emoji.jison
	$(JISON) emoji.jison
