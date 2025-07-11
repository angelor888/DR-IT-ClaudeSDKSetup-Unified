#!/usr/bin/env node

// Load .env file
require('dotenv').config();

// Now run the actual refresh script
require('./refresh-quickbooks-token.js');