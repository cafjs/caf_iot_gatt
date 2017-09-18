
var  on = false;
var id =  null;
var counter = 0;

var serviceA = function(data) {
    data = String.fromCharCode.apply(null, data);
    if (data === 'on') {
        if (!id) {
            id = setInterval(function() {
                on = !on;
                LED1.write(on);
            }, 500);
        }
    } else if (data === 'off') {
        if (id) {
            clearInterval(id);
            on = false;
            LED1.write(on);
            id = null;
        }
    } else {
        console.log('Ooops: wrong command ' + data);
    }
};

setInterval(function() {
    counter = (counter + 1) % 256;
    NRF.updateServices({
        0xBCDE : {
            0xAAAA : {
                value : [ counter],
                readable: true,
                notify: true
            }
        }
    });
}, 2000);


NRF.setServices({
    0xBCDE : {
        0xABCD : {
            value : "off",
            writable : true,
            readable: true,
            onWrite : function(evt) {
                serviceA(evt.data);
            }
        },
        0xAAAA : {
            value : [0],
            readable: true,
            notify: true
        }
    }
},{advertise: ["BCDE"]});
