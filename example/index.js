/* global fetch */

require('whatwg-fetch')
const choo = require('choo')
const promisifyPlugin = require('../')
const html = require('choo/html')
const logPlugin = require('choo-log')
const debounce = require('debounce')
const { every } = require('./every')

const app = choo()
app.use(promisifyPlugin())
app.use(logPlugin())

app.model({
  state: {
    repo: 'yarnpkg/yarn',
    stars: null,
    loadingState: 'loading'
  },
  reducers: {
    updateStargazersCount: data => ({ stars: data }),
    updateRepo: data => ({ repo: data, stars: null }),
    loading: () => ({ loadingState: 'loading' }),
    loaded: () => ({ loadingState: 'loaded' })
  },
  effects: {
    fetchStargazersCount: async (data, state, send) => {
      await send('loading')
      try {
        const response = await fetch(`https://api.github.com/repos/${state.repo}`)
        if (response.status < 299) {
          const json = await response.json()
          const count = json.stargazers_count
          await send('updateStargazersCount', count)
        } else {
          throw new Error('request failed')
        }
      } catch (e) {
        await send('updateStargazersCount', '???')
      }
      await send('loaded')
    },
    updateRepoAndFetch: async (data, state, send) => {
      await send('updateRepo', data)
      await send('fetchStargazersCount')
    }
  },
  subscriptions: {
    regularlyFetchStargazersCount: (send) => every(60000, () => send('fetchStargazersCount'))
  }
})

app.router((route) => [
  route('/', mainView)
])

const tree = app.start()
document.body.appendChild(tree)

function mainView (state, prev, send) {
  const updateRepo = debounce(e => send('updateRepoAndFetch', e.target.value), 300)

  return html`
    <main>
      <input oninput=${updateRepo} value=${state.repo} />
      ${countView(state)}
      ${loadingMessageView(state)}
    </main>
  `
}

function loadingMessageView (state) {
  if (state.loadingState === 'loading') {
    return html`
      <p><em>Fetching stargazers count for ${state.repo}...</em></p>
    `
  }
}

function countView (state) {
  if (state.stars) {
    return html`
      <p>Stargazers count for ${state.repo}: ${state.stars}</p>
    `
  }
}
