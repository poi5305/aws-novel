function Client() {
  const client = 'client/';
  const args = Array.prototype.slice.call(arguments);
  this.get = function (cb) {
    const query = client + args.join('/');
    console.log(query);
    $.get(query).done(cb);
    return this;
  };
  this.url = function () {
    const query = client + args.join('/');
    return query;
  };
  return this;
}
