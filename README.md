# audiocracy-ws

WebSockets server for [audiocracy-web](https://github.com/mat-sz/audiocracy-web).

More details about the project are available in the [audiocracy-web](https://github.com/mat-sz/audiocracy-web) repository.

## Self-hosting

Please refer to the [Self-hosting](https://github.com/mat-sz/audiocracy-web#self-hosting) section in the [audiocracy-web](https://github.com/mat-sz/audiocracy-web) README.

## Installation

Run `yarn install`, `yarn build` and then simply run `yarn start`. For development you can also run audiocracy-ws with live reload, `yarn dev`.

## Configuration

`dotenv-flow` is used to manage the configuration.

The following variables are used for the configuration:

| Variable          | Default value | Description                                                                       |
| ----------------- | ------------- | --------------------------------------------------------------------------------- |
| `WS_HOST`         | `127.0.0.1`   | IP address to bind to.                                                            |
| `WS_PORT`         | `5000`        | Port to bind to.                                                                  |
| `WS_BEHIND_PROXY` | `no`          | Set to `yes` if you want the application to respect the `X-Forwarded-For` header. |
