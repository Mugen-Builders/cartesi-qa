# Charter: Misuse the CLI

**Time box:** 2 hours
**Last revised:** (update when you modify this charter)

## Theme

Put yourself in the shoes of a new developer trying the SDK for the first time. They don't read docs carefully; they try commands, make mistakes, expect clear errors. Find where the CLI fails them.

## Starting points

- Run commands in the wrong order: `cartesi run` before `cartesi build`, `cartesi hash` before anything, `cartesi deposit` with no node running.
- Pass invalid arguments: wrong flag names, missing required flags, conflicting flags, impossible values.
- Try `cartesi --help` and `cartesi <cmd> --help` for every command. Are the descriptions accurate? Do the flag defaults match actual behavior? (Prior cycle found advancer polling `--help` says 7s but starts at 3s.)
- Use `cartesi create` with weird template names, branches, special characters in app names.
- Start `cartesi run` with port conflicts, with Docker stopped, with insufficient resources.
- Run commands outside of a project directory.
- Mix CLI and node versions that shouldn't work together.

## What to look for

- Error messages that say what went wrong but not how to fix it
- Help text that doesn't match actual defaults
- Commands that silently do nothing when they should error
- Stack traces surfacing to the user
- Commands that succeed but in a confusing state

## Output

Session note in `cycles/<current-cycle>/session-notes/misuse-the-cli-YYYY-MM-DD.md`.

## Notes from past sessions

<!-- Add short notes after each session. -->
