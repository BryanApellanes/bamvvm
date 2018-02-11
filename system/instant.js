module.exports = function Instant(){
    var now = new Date();
    this.Month = now.getUTCMonth() + 1;
    this.Day = now.getUTCDate();
    this.Year = now.getUTCFullYear();
    this.Hour = now.getUTCHours();
    this.Minute = now.getUTCMinutes();
    this.Second = now.getUTCSeconds();
    this.Millisecond = now.getUTCMilliseconds();

    this.toString = function(){
        return this.Month + "/" + this.Day + "/" + this.Year + ";" + this.Hour + "." + this.Minute + "." + this.Second + "." + this.Millisecond;
    }
}