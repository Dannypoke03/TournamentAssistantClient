# Tournament Assistant Client

[![NPM Version][npm-version-image]][npm-url]

> A typescript & websocket based client for [Tournament Assistant](https://github.com/MatrikMoon/TournamentAssistant) a Beat Saber tournament mod

## Install

```console
npm i tournament-assistant-client
```

### Dependencies

```console
npm i google-protobuf
```

## Usage

The following will setup a basic Coordinator client and connect you to the TA server.

```ts
import { TAWebsocket } from "tournament-assistant-client";

new TAWebsocket({
	url: "ws://localhost:2053",
	name: "Danny",
});
```

### Base Options

| option     | type               | desc                                                              | required |
| ---------- | ------------------ | ----------------------------------------------------------------- | -------- |
| `url`      | string             | a websocket url that the TA server is hosted at                   | true     |
| `name`     | string             | Name of the coordinator connecting                                | true     |
| `password` | string             | Password to access the TA server if it has one                    | false    |
| `userId`   | string             | User Id of the connecting coordinator                             | false    |
| `options`  | connection options | Specific connection options to manage the TA Client, listed below | false    |

### Connection Options

| option                    | type     | desc                                                                                                                                                                                                                                       | Default |
| ------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------- |
| `autoReconnect`           | boolean  | Determines if it the client will attempt to reconnect to the server whenever it loses connection.                                                                                                                                          | true    |
| `autoReconnectInterval`   | number   | The number of `ms` to wait after losing connection before attempting to reconnect.                                                                                                                                                         | 10000   |
| `autoReconnectMaxRetries` | number   | Maximum number of failed connection attempts to the server before it gives up. Setting to -1 will disable the option                                                                                                                       | -1      |
| `logging`                 | boolean  | Whether or not to enable basic logging to the const                                                                                                                                                                                        | false   |
| `handshakeTimeout`        | number   | Websocket handshake timeout                                                                                                                                                                                                                | 0       |
| `autoInit`                | boolean  | Whether or not to automatically initiate the connection when the constructor is called                                                                                                                                                     | true    |
| `sendToSocket`            | function | An alternate function that the client can use to send packets to the TA server. This can be used in conjunction with the previous option if you'd like to integrate your own websocket implementation as opposed to using the built in one | null    |

#### Custom Transport

By providing a `sendToSocket` function and disabling `autoInit` you can overwrite the default websocket implementation in place for your own. `sendToSocket` will be used by any internal functions to send packets out through that websocket and incoming packets can be passed to `handlePacket`.

### Events

```ts
import { TAWebsocket } from "tournament-assistant-client";

const taWebsocket = new TAWebsocket({
	url: "ws://localhost:2053",
	name: "Danny",
});

taWebsocket.taClient.on("EVENT_NAME", (e) => {
	// listen to events here
});
```

#### Supported Events

- `coordinatorAdded`
- `coordinatorLeft`
- `matchCreated`
- `matchUpdated`
- `matchDeleted`
- `playerAdded`
- `playerUpdated`
- `playerLeft`
- `qualifierEventCreated`
- `qualifierEventUpdated`
- `qualifierEventDeleted`
- `acknowledgement`
- `command`
- `connect`
- `connectResponse`
- `event`
- `file`
- `forwardingPacket`
- `loadedSong`
- `loadSong`
- `message`
- `messageResponse`
- `playSong`
- `scoreRequest`
- `scoreRequestResponse`
- `songFinished`
- `submitScore`
- `response`
- `packet` - This will return any and all packets received

### Helper Functions

There are a handful of implemented helper functions to make some common tasks a little easier.

```ts
sendPacket(packet: Packets.Packet)

sendEvent(event: Packets.Event)

forwardPacket(ids: string[], packet: Packets.Packet)

createMatch(players: Models.Player[])

updateMatch(match: Models.Match)

closeMatch(match: Models.Match)

sendMessage(ids: string[], msg: Packets.Message)

loadSong(songName: string, hash: string, difficulty: BeatmapDifficulty, taMatch: Models.Match)

playSong(match: Models.Match, withSync = false, disable_pause = false, disable_fail = false, floating_scoreboard = false)

returnToMenu(ids: string[])
```

## License

[MIT](./LICENSE)

[npm-url]: https://npmjs.org/package/tournament-assistant-client
[npm-version-image]: https://badgen.net/npm/v/tournament-assistant-client
