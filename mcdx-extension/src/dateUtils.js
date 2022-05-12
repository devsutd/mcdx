module.exports = class DateUtils {

    getTime() {
        var current = new Date();
        return current.getHours() + ":" + current.getMinutes() + ":" + current.getSeconds() + " " + current.getMilliseconds(); 
    }
}