const ab2str = require('arraybuffer-to-string');

module.exports = {
    stringify: (data) => {
        try {
            data = JSON.parse(data);

            if (typeof data == "object") {
                if (data.hasOwnProperty("type") && data.hasOwnProperty("data")) {
                    if (data.type == "Buffer" && data.data.length > 0) {
                        try {
                            return ab2str(data.data);
                        } catch (ex) {
                            return data.data.toString();
                        }
                    }
                }
                return JSON.stringify(data || "");
            }
            return (data || "").toString().trim();
        }
        catch(ex) {
            return (data || "").toString().trim();
        }
    }
}