# y2pilot.com

Smart YouTube playlist manager app.

[Live app](https://y2pilot.com)

I decided to share this as open source even though it's far from a solid and clean codebase. It was developed over a long stretch of time, in my spare time and as a first experimental project in Vue.

Other than that, it works! It's functional. You can create and save Youtube playlists and have fun with it.

In case you decide to tamper with it, fork it, extend it or submit a PR don't hesitate to reach out and ask questions. I'll be happy to answer and help if need be, currently I don't have time to rethink and refactor the codebase.

## Local setup

```
cp .env.local-example .env.local
# update worker host to match your deployed instance
npm install
```

### Compiles and hot-reloads for development

```
npm run serve
```

### Compiles and minifies for production

```
npm run build
```

### Lints and fixes files

```
npm run lint
```

### Customize configuration

See [Configuration Reference](https://cli.vuejs.org/config/).
