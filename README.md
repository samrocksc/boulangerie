# boulangerie

---

The goal of SQL bread is to equalize the playing field for all of the differenct connection managers out there.

## TODO

---

- [x] allow in adapter interface for the output
- [ ] Incorporate pagination
- [ ] Create a helper function for custom querybuilder count queries
- [ ] Create an alternative delivery from raw sql
- [ ] Tests with sequelize
- [ ] Tests with knex
- [ ] Tests with mysql-bricks
- [ ] Allow flag for continuous resolution
- [ ] Adapter for AWS DataAPI with MySQL
- [x] adapter for knex/postgres
- [x] adapter for knex/mysql
- [x] adapter for graphql/apollo

## Phases

---

- _build_ - building your query. Typically we would put our query builder here(graphql, knex, sequelize). Afterwards you could load an adapter function(e.g. bread) in order to extend build functionality
- _service_ - service allows the user to pick whatever layer they want to gather data through. It could be Apollo, Appsync, DataAPI, or the original case for this: sql.
- _output_ - Let's say we're getting something stripped down for efficiency from our server. We can rebuild our data smartly on this layer.

# How it works

---

The premise of using this package is to be able to create 2 sensical phases of functions for any kind of data retrieval(if you wanted, you could add FTP in this)....a builder, and an executor.

### \* Builder

---

The `builder` is a list of query styles you can build for your queries it holds the `build` phase. You may want to have domain specific builders in this circumstance. Assume you have a list of properties, and each property has different types of queries. Simply design your builder to be able to have property specific queries in it. Maybe you just want to have a broad query that allows you to dump raw into it? That's doable too, it all goes down to what you want to be able to extend your build to be

### \* Executor

---

The `executor` is an asyncronous wrapper of builder that holds the `service` and `output` phases. It will apply and process all three phases and give you the data back
