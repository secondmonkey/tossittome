var log = require('toss/common/log');

function insertPage(connection, tosserId, catcherId, url, title, cb) {
  connection.query(
      'insert into pages (user_id, catcher_id, url, title) values (?, ?, ?, ?)',
      [tosserId, catcherId, url, title],
      function(error, results) {
        if (error) {
          return cb(error);
        }
        return cb(null, { id: results.insertId });
      });
}

function fetchNextPages(connection, catcherId, cb) {
  connection.query(
      'select id, url, title from pages where catcher_id=? and served_at is null order by created_at for update',
      catcherId,
      function(error, pages) {
        if (error) {
          return cb(error);
        }
        if (pages.length <= 0) {
          return cb(null, { noResults: true });
        }

        log.info('Next records for user [%s] are [%j]', catcherId, pages);
        var ids = pages.map(function(r) { return r.id; });
        var qqs = '?';
        for (var i = 1; i < ids.length; i++) {
          qqs += ',?';
        }
        connection.query(
            'update pages set served_at=now() where id in (' + qqs + ')',
            ids,
            function(error, results) {
              if (error) {
                return cb(error);
              }
              log.info('Recorded serving for rows %j', ids);
              return cb(null, pages);
            });
      });
}

module.exports = {
  insertPage     : insertPage,
  fetchNextPages : fetchNextPages
};
