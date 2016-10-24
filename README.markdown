# Promisify Barracks

## What is barracks?

From <https://github.com/yoshuawuyts/barracks>:

> Action dispatcher for unidirectional data flows. Creates tiny models
> of data that can be accessed with actions through a small API.

This plugin makes `subscriptions` and `effects` work with promises. It
also wraps `send` inside `subscriptions` and `effects` to return a
promise which is resolved when it has completely finished. Basically
`done` is called automatically when the promise is resolved or rejected.

## Usage

```js
const promisifyPlugin = require('barracks-promisify-plugin')
const barracks = require('barracks')

function wait (timeout) {
  return new Promise(resolve => setTimeout(() => resolve(), timeout))
}

const store = barracks()
store.use(promisifyPlugin())
store.model({
  state: { stars: null },
  reducers: {
    updateStargazersCount: (state, data) => ({stars: data })
  },
  effects: {
    fetchStargazersCount: async (state, data, send) => {
      const response = await fetch("https://api.github.com/repos/yarnpkg/yarn")
      const json = await response.json()
      const count = json.stargazers_count
      await send('updateStargazersCount', count)
    }
  },
  subscriptions: {
    regularlyFetchStargazersCount: async (send) => {
      while (true) {
        await send('fetchStargazersCount')
        await wait(60000)
      }
    }
  }
})
const createSend = store.start()
const send = promisifyPlugin.promisifySend(createSend('send'))
send('updateStargazersCount', 1).then(() => console.log('up and running'))
```

## What about [`choo`](https://github.com/yoshuawuyts/choo)

This plugin works perfectly fine with choo as well, since choo is just
an opinionated wrapper around barracks.

```js
const choo = require('choo')
const promisifyPlugin = require('barracks-promisify-plugin')
const html = require('choo/html')

const app = choo()
app.use(promisifyPlugin())

function every (interval, cb) {
  return new Promise((_, reject) => {
    const intervalId = setInterval(() => {
      Promise.resolve(cb()).catch(e => {
        clearInterval(intervalId)
        reject(e)
      })
    }, interval)
  })
}

app.model({
  state: {
    stars: null,
    loadingState: 'loading'
  },
  reducers: {
    updateStargazersCount: (_, data) => ({ stars: data }),
    loading: () => ({ loadingState: 'loading' }),
    loaded: () => ({ loadingState: 'loaded' })
  },
  effects: {
    fetchStargazersCount: async (_, __, send) => {
      await send('loading')
      const response = await fetch("https://api.github.com/repos/yarnpkg/yarn")
      const json = await response.json()
      const count = json.stargazers_count
      await send('updateStargazersCount', count)
      await send('loaded')
    }
  },
  subscriptions: {
    regularlyFetchStargazersCount: (send) => every(60000, () => send('fetchStargazersCount'))
  }
})

const loadingMessage = state => {
  if (state.loadingState === 'loading') {
    return html`
      <p><em>Fetching stargazers count...</em></p>
    `
  } else {
    return ''
  }
}

const mainView = (state, prev, send) => html`
  <main>
    <h1>Yarn Stars!</h1>
    ${loadingMessage(state)}
    <p>Stargazers count: ${state.count}</p>
  </main>
`

app.router((route) => [
  route('/', mainView)
])

const tree = app.start()
document.body.appendChild(tree)
```

## Tests

I'm using [`blue-tape`](https://github.com/spion/blue-tape) to write simple tests.

See `test.js` and try out `npm t`

## License

MIT → See `LICENSE` file.
