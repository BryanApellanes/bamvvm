module.exports = (function(bam){
    function propertiesToString(obj){
        let output = '';

        for(var prop in obj){
            output += prop + ": " + obj[prop] + "\r\n";
        }
        return output;
    }

    bam.propertiesToString = propertiesToString;
    
    return propertiesToString;
})(bam)