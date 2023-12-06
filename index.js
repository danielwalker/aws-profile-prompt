#!/usr/bin/env node

import fs from 'fs'
import prompts from 'prompts'
import chalk from 'chalk'

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

const HOME = process.env['HOME'];

const AWS_PROFILE = process.env['AWS_PROFILE'];

if (!HOME) {
    console.err("HOME is not set. Please set a HOME environment variable.");
}

const credentials = await readFileAsString(`${HOME}/.aws/credentials`);

const config = await readFileAsString(`${HOME}/.aws/config`);

const merged = credentials + '\n' + config;

if (merged.trim() === '') {
    console.log(chalk.red("There is no AWS config in ~/.aws"));
    process.exit(1);
}

const profiles = findProfiles(merged)

if (!profiles.length) {
    console.log(chalk.red("There are no AWS profiles in ~/.aws"));
    process.exit(1);
}

const choices = profiles.map((p) => ({
    title: p
}))

choices.unshift({
    title: 'none',
    value: ' '
})

const response = await prompts({
    type: 'autocomplete',
    limit: 20,
    name: 'value',
    message: 'Set AWS Profile',
    initial: AWS_PROFILE ?? '',
    choices,
    suggest
});

await fs.writeFileSync(`${HOME}/.awsp`, `export AWS_PROFILE=${response.value ?? ''}\n`)
