# Configurations

## Docker deployment configuration
You can copy `/infra/docker/.env.template` file to `/infra/docker/.env` file and set the values. `.env` file will be used automatically by the '`docker compose ...`' command.
<table>
    <tr>
        <th>Variable name</th>
        <th>Description</th>
    </tr>
    <tr>
        <td><code>DOMAIN_NAME</code></td>
        <td>Domain name for generating a self-signed certificate</td>
    </tr>
    <tr>
        <td><code>MONGODB_INITDB_ROOT_USERNAME</code></td>
        <td>Initial username for root account</td>
    </tr>
    <tr>
        <td><code>MONGODB_INITDB_ROOT_USERNAME</code></td>
        <td>Initial password for root account</td>
    </tr>
    <tr>
        <td><code>MONGODB_INITDB_DATABASE</code></td>
        <td>
            Default database for executing the initiate script<br/>
            (<code>/infra/docker/mongoDb/initiate.js</code>)
        </td>
    </tr>
    <tr>
        <td><code>BACKEND_USER</code></td>
        <td>Username of the account for backend server</td>
    </tr>
    <tr>
        <td><code>BACKEND_PASSWORD</code></td>
        <td>Password of the account for backend server</td>
    </tr>
    <tr>
        <td><code>VITE_API_BASE_URL</code></td>
        <td>
            Base URL for frontend to call to the backend server.<br/>
            To avoid using <code>.env</code> file during building process of the frontend (<code>Vite</code>), we have to pass <code>VITE_API_BASE_URL</code> as an argument to build state. This value will be used in the <code>Vite</code> configuration file.
        </td>
    </tr>
</table>


## Frontend configuration
You can copy `/apps/web/env/.env.template` file to `/apps/web/env/.env` file and set the values. `.env` file will be used automatically by the `Vite`.<br/>
[Read more about `Vite` environment variables](https://vitejs.dev/guide/env-and-mode.html#env-files)
<table>
    <tr>
        <th>Variable name</th>
        <th>Description</th>
    </tr>
    <tr>
        <td><code>VITE_API_BASE_URL</code></td>
        <td>Base URL for frontend to call to the backend server.</td>
    </tr>
</table>

## Backend configuration
You can copy `/apps/api/env/.env.template` file to `/apps/api/env/.env` file and set the values.
<table>
    <tr>
        <th>Variable name</th>
        <th>Description</th>
    </tr>
    <tr>
        <td><code>TZ</code></td>
        <td>Timezone of backend server (should be set to UTC)</td>
    </tr>
    <tr>
        <td><code>NODE_ENV</code></td>
        <td>Node.js environment [test|development|production]</td>
    </tr>
    <tr>
        <td><code>APP_NAME</code></td>
        <td>Application name (no use case yet)</td>
    </tr>
    <tr>
        <td><code>APP_VERSION</code></td>
        <td>Application version (no use case yet)</td>
    </tr>
    <tr>
        <td><code>APP_GRACEFUL_PERIOD_MS</code></td>
        <td>Period of time (in ms.) that allow process to handle the TERM signal before force shutdown.</td>
    </tr>
    <tr>
        <td><code>LOG_LEVEL</code></td>
        <td>Log level [trace|debug|info|warn|error|fatal]</td>
    </tr>
    <tr>
        <td><code>LOG_FILE_ENABLE</code></td>
        <td>Enable log output to file</td>
    </tr>
    <tr>
        <td><code>LOG_FILE_PATH</code></td>
        <td>File path for log output</td>
    </tr>
    <tr>
        <td><code>HTTP_PORT_NUMBER</code></td>
        <td>Port number for Http server</td>
    </tr>
    <tr>
        <td><code>BNB_HTTP_BASE_URL</code></td>
        <td>
            Base endpoint for Binance server<br/>
            <a href="https://binance-docs.github.io/apidocs/spot/en/#general-info">More information</a>
        </td>
    </tr>
    <tr>
        <td><code>BNB_PUBLIC_DATA_BASE_URL</code></td>
        <td>
            Base endpoint for downloading Binance public data<br/>
            <a href="https://github.com/binance/binance-public-data">More information</a>
        </td>
    </tr>
    <tr>
        <td><code>DOWNLOAD_OUTPUT_PATH</code></td>
        <td>Target directory for downloaded files</td>
    </tr>
    <tr>
        <td><code>MONGODB_URI</code></td>
        <td>MongoDB connection string</td>
    </tr>
    <tr>
        <td><code>JOB_COLLECTION_NAME</code></td>
        <td>MongoDB collection name for Agenda job scheduler</td>
    </tr>
    <tr>
        <td><code>BT_JOB_CONCURRENCY</code></td>
        <td>How many backtesting strategies can be executed at the same time (Each execution will spawn their own process)</td>
    </tr>
    <tr>
        <td><code>BT_JOB_TIMEOUT_MS</code></td>
        <td>Timeout for executing the whole backtesting job</td>
    </tr>
    <tr>
        <td><code>EXECUTE_STRATEGY_TIMEOUT_MS</code></td>
        <td>Timeout for executing strategy body in each interval</td>
    </tr>
    <tr>
        <td><code>BT_PROGRESS_UPDATE_INTERVAL</code></td>
        <td>Interval of updating execution progress (progress percentage and execution logs)</td>
    </tr>
</table>
