#
# Copyright (c) 2012, Joyent, Inc. All rights reserved.
#
# Makefile: basic Makefile for template API service
#
# This Makefile is a template for new repos. It contains only repo-specific
# logic and uses included makefiles to supply common targets (javascriptlint,
# jsstyle, restdown, etc.), which are used by other repos as well. You may well
# need to rewrite most of this file, but you shouldn't need to touch the
# included makefiles.
#
# If you find yourself adding support for new targets that could be useful for
# other projects too, you should add these to the original versions of the
# included Makefiles (in eng.git) so that other teams can use them too.
#

#
# Tools
#
NPM       := npm
WHISKEY		:= ./node_modules/.bin/whiskey
NODEUNIT	:= ./node_modules/.bin/nodeunit
WHISKEY_ARGS	:= --test-reporter tap --failfast --sequential --real-time --timeout 120000 --tests
NODEUNIT_ARGS   :=

#
# Files
#
DOC_FILES	 = index.restdown
JS_FILES	:= $(shell find lib test -name '*.js')
JSL_CONF_NODE	 = tools/jsl.node.conf
JSL_FILES_NODE   = $(JS_FILES)
JSSTYLE_FILES	 = $(JS_FILES)
JSSTYLE_FLAGS    = -o indent=2,doxygen,unparenthesized-return=0

include ./tools/mk/Makefile.defs

#
# Repo-specific targets
#
.PHONY: all
all:
	$(NPM) rebuild

.PHONY: test ca_test mapi_test ufds_test config_test

ca_test: $(WHISKEY)
	$(WHISKEY) $(WHISKEY_ARGS) test/ca.test.js

mapi_test: $(WHISKEY)
	$(WHISKEY) $(WHISKEY_ARGS) test/mapi.test.js

vmapi_test: $(NODEUNIT)
	$(NODEUNIT) $(NODEUNIT_ARGS) test/vmapi.test.js

cnapi_test: $(NODEUNIT)
	$(NODEUNIT) $(NODEUNIT_ARGS) test/cnapi.test.js

ufds_test:
	$(WHISKEY) $(WHISKEY_ARGS) test/ufds.test.js

config_test:
	$(WHISKEY) $(WHISKEY_ARGS) test/ufds.test.js

test: ca_test mapi_test ufds_test config_test

.PHONY: setup
setup:
	$(NPM) install

include ./tools/mk/Makefile.deps
include ./tools/mk/Makefile.targ