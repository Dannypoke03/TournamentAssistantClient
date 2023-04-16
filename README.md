# Tournament Assistant Client

[![NPM Version][npm-version-image]][npm-url]

> A typescript & websocket based client for [Tournament Assistant](https://github.com/MatrikMoon/TournamentAssistant) a Beat Saber tournament mod

## Install

```console
npm i tournament-assistant-client
```

## Usage

The following will setup a basic Coordinator client and connect you to the TA server.

```ts
import { Client } from "tournament-assistant-client";

new Client("Danny", {
    url: "ws://localhost:2053"
});
```

### Base Options

| option     | type               | desc                                                              | required |
| ---------- | ------------------ | ----------------------------------------------------------------- | -------- |
| `url`      | string             | a websocket url that the TA server is hosted at                   | true     |
| `password` | string             | Password to access the TA server if it has one                    | false    |
| `userId`   | string             | User Id of the connecting coordinator                             | false    |
| `options`  | connection options | Specific connection options to manage the TA Client, listed below | false    |

### Connection Options

| option                    | type     | desc                                                                                                                                                                                                                                       | Default |
| ------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------- |
| `autoReconnect`           | boolean  | Determines if it the client will attempt to reconnect to the server whenever it loses connection.                                                                                                                                          | true    |
| `autoReconnectInterval`   | number   | The number of `ms` to wait after losing connection before attempting to reconnect.                                                                                                                                                         | 10000   |
| `autoReconnectMaxRetries` | number   | Maximum number of failed connection attempts to the server before it gives up. Setting to -1 will disable the option                                                                                                                       | -1      |
| `handshakeTimeout`        | number   | Websocket handshake timeout                                                                                                                                                                                                                | 0       |
| `autoInit`                | boolean  | Whether or not to automatically initiate the connection when the constructor is called                                                                                                                                                     | true    |
| `sendToSocket`            | function | An alternate function that the client can use to send packets to the TA server. This can be used in conjunction with the previous option if you'd like to integrate your own websocket implementation as opposed to using the built in one | null    |

#### Custom Transport

By providing a `sendToSocket` function and disabling `autoInit` you can overwrite the default websocket implementation in place for your own. `sendToSocket` will be used by any internal functions to send packets out through that websocket and incoming packets can be passed to `handlePacket`.

### Events

```ts
import { Client } from "tournament-assistant-client";

const taClient = new Client("Danny", {
    url: "ws://localhost:2053"
});

taClient.on("EVENT_NAME", e => {
    // listen to events here
});
```

#### Supported Events

##### User Events

-   `userAdded`
-   `userUpdated`
-   `userLeft`

##### Match Events

-   `matchCreated`
-   `matchUpdated`
-   `matchDeleted`

##### Qualifier Events

-   `qualifierEventCreated`
-   `qualifierEventUpdated`
-   `qualifierEventDeleted`

##### Commands

-   `loadSong`
-   `playSong`
-   `sendBotMessage`
-   `showModal`

##### Push Events

-   `pushLeaderboardScore`
-   `songFinished`
-   `realtimeScore`

##### Requests

-   `connectRequest`
-   `leaderboardScoreRequest`
-   `preloadImageForStreamSync`

##### Responses

-   `connectResponse`
-   `leaderboardScoreResponse`
-   `loadedSong`
-   `modalResponse`
-   `imagePreloaded`

##### Other

-   `acknowledgement`
-   `forwardingPacket`
-   `packet`

##### Non-TA related Events

-   `wsConnected`
-   `taConnected`
-   `close`
-   `error`

## Versions

| TA Version    | Client Version |
| ------------- | -------------- |
| 0.7.3         | 0.9.4          |
| 0.7.2         | 0.9.2          |
| 0.7.0 ~ 0.7.1 | 0.9.1          |

## License

[MIT](./LICENSE)

[npm-url]: https://npmjs.org/package/tournament-assistant-client
[npm-version-image]: https://badgen.net/npm/v/tournament-assistant-client
