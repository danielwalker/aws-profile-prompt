#!/usr/bin/env node

import fs from 'fs'
import prompts from 'prompts'

const NONE_VALUE = 'awsp.none'

const HOME = process.env['HOME'];

const AWS_PROFILE = process.env['AWS_PROFILE'];

if (!HOME) {
    console.log("Error: HOME is not set. Please set a HOME environment variable.");
}

/**
 * Suggests profiles based on input.
 */
const suggest = (input, choices) => {

    // Split the input into words.
    const inputWords = input.toLowerCase().split(/\s+/);

    return choices.filter(choice => {
        const lowerCaseTitle = choice.title.toLowerCase();
        return inputWords.every(word => lowerCaseTitle.includes(word));
    });
}

/**
 * Finds a list of profiles in AWS config.
 */
const findProfiles = (config) => {

    // This will work for profiles stored in credentials OR config.
    const regex = /\[(?:profile\s+)?([^\]]+)\]/g;

    // The list of profiles.
    const matches = [];

    // Find all profiles in config.
    let match;
    while ((match = regex.exec(config)) !== null) {
        matches.push(match[1]);
    }

    return matches;
}

/**
 * Silently reads a file to a string. Returns an empty string if the file does not exist.
 */
const readFileAsString = async (path) => {
    if (fs.existsSync(path)) {
        const buffer = await fs.readFileSync(path)
        return buffer.toString('utf-8')
    }
    return ""
}

/**
 * Returns the content of the .awsp file that will be sourced to set the environment variable. This will either set
 * AWS_PROFILE or remove it.
 */
const makeExport = (value) => {
    if (value === NONE_VALUE) {
        return 'unset AWS_PROFILE'
    } else {
        return `export AWS_PROFILE=${value}`
    }
}


// Read and merge .aws credentials and config.
const credentials = await readFileAsString(`${HOME}/.aws/credentials`);
const config = await readFileAsString(`${HOME}/.aws/config`);
const merged = credentials + '\n' + config;

// Validate that we have config.
if (merged.trim() === '') {
    console.log("Error: Did not find ~/.aws/config or ~/.aws/credentials");
    process.exit(1);
}

// Find all profiles in the config.
const profiles = findProfiles(merged)

// Validate that we have profiles.
if (!profiles.length) {
    console.log("Error: Could not find any AWS profile configuration in ~/.aws");
    process.exit(1);
}

// Build the array of profile choices.
const choices = profiles.map((p) => ({
    title: p
}))

// Add the [none] choice.
choices.unshift({
    title: '[none]',
    value: NONE_VALUE,
})

// Display the prompt.
const response = await prompts({
    type: 'autocomplete',
    limit: 20,
    name: 'value',
    message: 'aws profile',
    initial: AWS_PROFILE ?? NONE_VALUE,
    choices,
    suggest
});

await fs.writeFileSync(`${HOME}/.awsp`, makeExport(response.value))
