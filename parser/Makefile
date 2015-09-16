JISON = jison
CBKB = node emoji-cli.js

.PHONY: all
all: emoji.js

.PHONY: dependencies
dependencies:
	npm install

# Rule to compile the CBKB parser
emoji.js: emoji.jison
	$(JISON) emoji.jison

.PHONY: emoji-cli.js
emoji-cli.js: emoji.js codegen.js

# General rule for compiling CBKB programs.
%.emj.js: %.emj emoji-cli.js
	$(CBKB) $<
