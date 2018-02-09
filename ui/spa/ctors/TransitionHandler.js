/**
 * @constructor
 * @param from
 * @param to
 * @param fn
 */
module.exports = function transitionHandler(name, from, to, fn) {
    var the = this,
        transition = fn;

    this.name = name;
    this.from = from;
    this.to = to;

    if (_.isString(name) && _.isString(from) && _.isFunction(to)) {
        this.from = name;
        this.to = from;
        this.name = this.from + "to" + this.to;
        transition = to;
    }

    var _start = function () {
        $(the).trigger("start");
    };

    this.play = function (data) {
        _start();
        transition(the, data);
        _end();
    };

    var _end = function () {
        $(the).trigger("end", the);
    }
}