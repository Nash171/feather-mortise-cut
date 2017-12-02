var five = require("johnny-five");
var async = require("async");
var board = new five.Board();

board.on("ready", function() {

    var stepperX = new five.Stepper({
        type: five.Stepper.TYPE.DRIVER,
        stepsPerRev: 200,
        pins: {
            step: 2,
            dir: 5,
            enable: 8
        }
    });

    var stepperY = new five.Stepper({
        type: five.Stepper.TYPE.FOUR_WIRE,
        stepsPerRev: 64,
        pins: [3,4,6,7]
    });

    
    var cuts = [[500, 200], [1500, 200]];
    
    var cut_speed = 30; // 2cm/s (*15)
    var free_speed = 120; // 8cm/s
    
    var speed_y = 180; // 12cm/s
    var step_y = 6;
    var step_y_size = 200; // 40mm (5 step/mm) (*5)
    var margin = 100; // 20mm
    
    var actions = [];
    cuts.map(function(cut){
        actions.push([0, cut[0], free_speed]);
        for(var i=1; i<=step_y; i++){
            actions.push([1, margin + i*step_y_size, speed_y]);
            actions.push([0, cut[0]+(i%2 ? cut[1]:0), cut_speed]);
        }
        actions.push([1, 0, speed_y]);
    })

    actions.push([0, 0,free_speed]);

    var cur_pos = 0;
    var depth = 0;
    async.mapSeries(actions, function(action, callback) {        
               
        var position = action[1];
        var rpm = action[2];

        if(action[0]){
            stepperY.step({
                steps: Math.abs(position - depth),
                direction: position > depth ? 1 : 0,
                rpm: rpm,
            }, function() {
                console.log((position - depth) + " steps moved , cur depth = "+position);
                depth = position;
                callback(null, true);
            }); 
        }
        else{
            stepperX.step({
                steps: Math.abs(position - cur_pos),
                direction: position > cur_pos ? 1 : 0,
                rpm: rpm
            }, function() {
                console.log((position - cur_pos) + " steps moved , cur pos = "+position);
                cur_pos = position;
                callback(null, true);
            }); 
        }
        
    }, function(err, results) {
        console.log(results);
    });
});
