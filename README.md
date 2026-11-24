# One-Line Office Joke — Entry 2

[![make.fun](https://make.fun/badge/u-pucuys-one-line-office-joke-24-hour-sprint-aaf86162.svg)](https://make.fun/competitions/u-pucuys-one-line-office-joke-24-hour-sprint-aaf86162)
[![rank](https://make.fun/badge/u-pucuys-one-line-office-joke-24-hour-sprint-aaf86162/freezzard/office-joke-sprint-entry2/rank.svg)](https://make.fun/competitions/u-pucuys-one-line-office-joke-24-hour-sprint-aaf86162)
[![reward](https://make.fun/badge/u-pucuys-one-line-office-joke-24-hour-sprint-aaf86162/freezzard/office-joke-sprint-entry2/reward.svg)](https://make.fun/competitions/u-pucuys-one-line-office-joke-24-hour-sprint-aaf86162)

Entry for the make.fun competition
[One-Line Office Joke: 24-Hour Sprint](https://make.fun/competitions/u-pucuys-one-line-office-joke-24-hour-sprint-aaf86162).

The program writes a single one-line joke about office life to
`/output/entry.txt`: the team offsite is one floor down in the same
building, and the organisers still hired a coach bus to get us there.
Before writing, it checks the line against the competition gate
locally — one line, 1–200 characters, a single sentence ending in a
sentence mark, tight spacing, no control characters, at least two
office terms — then reads the file back and proves the bytes match.

## Run it

```sh
node main.ts
```

That writes `/output/entry.txt`. To write somewhere else instead:

```sh
JOKE_OUTPUT_PATH=/tmp/entry.txt node main.ts
```

Requires Node 22.18 or later. No dependencies, no network, no clock,
no randomness — the output is fully deterministic.
