# Autonomous Arcade Project Brief

## Product Summary

Autonomous Arcade is a public web arcade developed by the Autonomous Engineering Platform (AEP) by CognicellAI. The site should let anyone play simple browser games immediately, without accounts or setup, while giving CognicellAI a concrete project to showcase autonomous software delivery in public.

The product should feel like a compact modern arcade: fast to load, easy to browse, and rewarding in short sessions.

## Audience

- People curious about autonomous software engineering.
- Developers and technical leaders evaluating AEP.
- Casual visitors who just want to play a quick game.
- Future contributors watching how autonomous agents evolve a project.

## MVP Experience

A visitor lands on the arcade and can immediately:

- Choose from a small set of games.
- Play without logging in.
- Receive an anonymous local player identity.
- See basic scores or recent runs.
- Read a short note that the project is developed by AEP by CognicellAI.

The MVP should avoid heavyweight social features, complex moderation, payments, or account management.

## Candidate MVP Games

### Reaction Rush

A reflex game where the player waits for a signal and responds as quickly as possible. It should be simple, measurable, and ideal for a first leaderboard.

### Word Grid

A compact word or pattern puzzle that can refresh daily. It should be deterministic enough to test and replay.

### Living Dungeon Mini

A small turn-based dungeon crawler with a daily seed, a few room types, simple combat, and a run summary.

## Anonymous Player Model

For MVP, authentication is intentionally out of scope.

The application can generate a browser-local player ID on first visit and store it in local storage. Players may optionally choose a display name. If browser storage is cleared, the player becomes a new anonymous player.

## Showcase Value

Autonomous Arcade should demonstrate that AEP can take a product idea and evolve it into working software through repeatable engineering loops:

- project spec
- plan
- work graph
- ChangeSet
- tests
- CI evidence
- pull request
- merge
- visible product improvement

The showcase should stay product-first. Visitors should experience a real arcade first, then discover that it is being built by AEP.

## Near-Term Roadmap

1. Create the app shell and game registry.
2. Add anonymous browser-local player identity.
3. Ship Reaction Rush as the first playable game.
4. Add Word Grid as a second playable game.
5. Add Living Dungeon Mini as a featured game.
6. Add basic score tracking.
7. Add a public build log describing AEP-delivered changes.
