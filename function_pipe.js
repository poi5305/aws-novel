const _ = require('lodash');

class CallFunctionAsArgument {
  constructor(fn, args) {
    this.fn = fn;
    this.args = args;
  }
}

class FunctionPipe {
  constructor(fn, inputOrder, outPipes) {
    this.functionNumber = 0;
    this.catchNumber = 0;

    this.pipeOutBuffer = {};
    this.pipeErrBuffer = {};

    this.promise = Promise.resolve();
    this.run = true;
    this.pipe(fn, inputOrder, outPipes);
  }

  static pushToPipe(pipeBuf, fnIdx, pipes, value) {
    const pipeBuffer = pipeBuf;
    const pushValueToPipeBuffer = (idx, v) => {
      if (_.isUndefined(pipeBuffer[idx])) {
        pipeBuffer[idx] = [];
      }
      pipeBuffer[idx].push(v);
    };

    if (_.isArray(pipes)) {
      _.forEach(pipes, (outIdx) => {
        pushValueToPipeBuffer(fnIdx + outIdx, value);
      });
    } else if (_.isNumber(pipes)) {
      pushValueToPipeBuffer(fnIdx + pipes, value);
    } else {
      pushValueToPipeBuffer(fnIdx + 1, value);
    }
  }

  static reOrderArgs(fn, inputOrder) {
    let func = fn;
    if (_.isArray(inputOrder)) {
      func = _.rearg(fn, inputOrder);
    }
    return func;
  }

  promise() {
    return this.promise;
  }

  newCatchThenFunction(fn, inputOrder, outPipes, errPipes) {
    this.catchNumber += 1;
    const fnIdx = this.functionNumber;
    const erIdx = this.catchNumber;
    const func = FunctionPipe.reOrderArgs(fn, inputOrder);

    const wrapFunc = () => {
      if (!this.run) return {};
      const args = _.get(this.pipeErrBuffer, erIdx, []);
      const result = func(...args);

      if (result instanceof Promise) {
        return result
        .then((value) => {
          FunctionPipe.pushToPipe(this.pipeErrBuffer, erIdx, outPipes, value);
          return Promise.reject();
        })
        .catch((value) => {
          FunctionPipe.pushToPipe(this.pipeErrBuffer, erIdx, errPipes, value);
          return Promise.reject();
        });
      }
      return new Promise((resolve) => {
        resolve(result);
      });
    };
    return wrapFunc;
  }

  newCatchFunction(fn, inputOrder, outPipes, errPipes) {
    this.catchNumber += 1;
    const fnIdx = this.functionNumber;
    const erIdx = this.catchNumber;
    const func = FunctionPipe.reOrderArgs(fn, inputOrder);

    const wrapFunc = () => {
      if (!this.run) return {};
      const args = _.get(this.pipeErrBuffer, erIdx, []);
      const result = func(...args);

      if (result instanceof Promise) {
        return result
        .then((value) => {
          FunctionPipe.pushToPipe(this.pipeOutBuffer, fnIdx, outPipes, value);
          return Promise.resolve();
        })
        .catch((value) => {
          FunctionPipe.pushToPipe(this.pipeErrBuffer, erIdx, errPipes, value);
          return Promise.reject();
        });
      }
      return new Promise((resolve) => {
        resolve(result);
      });
    };
    return wrapFunc;
  }

  newPipeFunction(fn, inputOrder, outPipes, errPipes) {
    this.functionNumber += 1;
    const fnIdx = this.functionNumber;
    const erIdx = this.catchNumber;
    const func = FunctionPipe.reOrderArgs(fn, inputOrder);

    const wrapFunc = () => {
      if (!this.run) return {};
      const args = _.get(this.pipeOutBuffer, fnIdx, []);
      const result = func(...args);

      if (result instanceof Promise) {
        return result
        .then((value) => {
          FunctionPipe.pushToPipe(this.pipeOutBuffer, fnIdx, outPipes, value);
          return Promise.resolve();
        })
        .catch((value) => {
          FunctionPipe.pushToPipe(this.pipeErrBuffer, erIdx, errPipes, value);
          return Promise.reject();
        });
      }
      FunctionPipe.pushToPipe(this.pipeOutBuffer, fnIdx, outPipes, result);
      return Promise.resolve();
    };
    return wrapFunc;
  }

  newMapFunction(fn, inputOrder, outPipes, errPipes) {
    this.functionNumber += 1;
    const fnIdx = this.functionNumber;
    const erIdx = this.catchNumber;
    const func = FunctionPipe.reOrderArgs(fn);

    const wrapFunc = () => {
      if (!this.run) return {};
      const args = _.flatten(_.get(this.pipeOutBuffer, fnIdx, []));
      const promises = _.map(args, arg => func(arg));

      return Promise.all(promises)
      .then((value) => {
        FunctionPipe.pushToPipe(this.pipeOutBuffer, fnIdx, outPipes, value);
        return Promise.resolve();
      })
      .catch((value) => {
        FunctionPipe.pushToPipe(this.pipeErrBuffer, erIdx, errPipes, value);
        return Promise.reject();
      });
    };
    return wrapFunc;
  }

  pipeMap(fn, inputOrder, outPipes, errPipes) {
    const wrapFunc = this.newMapFunction(fn, inputOrder, outPipes, errPipes);
    this.promise = this.promise.then(wrapFunc);
    return this;
  }

  pipeMapSpread(fn, inputOrder, outPipes, errPipes) {
    return this.pipeMap(_.spread(fn), inputOrder, outPipes, errPipes);
  }

  pipe(fn, inputOrder, outPipes, errPipes) {
    const wrapFunc = this.newPipeFunction(fn, inputOrder, outPipes, errPipes);
    this.promise = this.promise.then(wrapFunc);
    return this;
  }

  pipeSpread(fn, inputOrder, outPipes, errPipes) {
    return this.pipe(_.spread(fn), inputOrder, outPipes, errPipes);
  }

  catch(fn, inputOrder, outPipes, errPipes) {
    const func = this.newCatchFunction(fn, inputOrder, outPipes, errPipes);
    this.promise = this.promise.catch(func);
    return this;
  }

  catchThen(fn, inputOrder, outPipes, errPipes) {
    const func = this.newCatchThenFunction(fn, inputOrder, outPipes, errPipes);
    this.promise = this.promise.catch(func);
    return this;
  }

  catchStop(fn, inputOrder, outPipes, errPipes) {
    const func = this.newCatchFunction(fn, inputOrder, outPipes, errPipes);
    this.promise = this.promise.catch((...args) => {
      const r = func(...args);
      this.run = false;
      return r;
    });
    return this;
  }

  static lazyImpl(args) {
    return _.map(args, (arg) => {
      if (arg instanceof CallFunctionAsArgument) {
        return arg.fn(...arg.args);
      }
      return arg;
    });
  }

  static pipe(func, inputOrder, outPipes, errPipes) {
    return new FunctionPipe(func, inputOrder, outPipes, errPipes);
  }

  static lazy(...args) {
    if (!_.isArray(args) || args.length === 0 || typeof args[0] !== 'function') {
      return args;
    }
    const fn = args.shift();
    return new CallFunctionAsArgument(fn, args);
  }

  static bind(fn, ...args) {
    return _.partial((...inArgs) => {
      const calledArgs = FunctionPipe.lazyImpl(inArgs);
      return fn(...calledArgs);
    }, ...args);
  }

  static map(fn) {
    return (items, ...args) => Promise.resolve(_.map(items, (item, key) => fn(item, key, ...args)));
  }

  static forEach(fn) {
    return (items, ...args) => {
      _.forEach(items, (item, key) => {
        fn(item, key, ...args);
      });
      return Promise.resolve(items);
    };
  }

}

module.exports = FunctionPipe;

