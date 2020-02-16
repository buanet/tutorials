// JavaScript zur Verwendung in ioBroker
//
// Das Script speichert bei Auslösung (z.B. durch einen Bewegungsmelder) drei Bilder einer Überwachungskamera in frei definierbaren Zeitabständen und versendet das erste Bild per telegram.
// Über telegram können dann bei Bedarf auch die weiteren zwei Bilder abgefragt werden. Natürlich ist auch eine manuelle Auslösung (ohne Bewegungsmelder) per telegram möglich.
// Der Automatische Versand der Bilder kann über telegram auch aktiviert/ deaktiviert werden. 
//
// Mehr Infos zum Script und dessen Einrichtung hier:  
  
// Hier können Einstellungen vorgenommen werden:
 
// Variablen
var cam_img = 'http://xxx:xx/cgi-bin/CGIProxy.fcgi?cmd=snapPicture2&usr=xxx&pwd=xxx';   // Pfad zum Kamerabild (Im Beispiel eine Foscam)
var trigger_auto = 'hm-rpc.0.JEQXXXXXXX.1.MOTION';  // Datenpunkt zur autmatischen Auslösung (Status des Bewegungsmelders, Fenster-/ Türkontakt oder der Türklingel)
var trigger_manu = 'javascript.0.notify.telegram.cam.trigger_manu'; // Datenpunkt zur manuellen Auslösung (wird bei Bedarf automatisch angelegt)
var trigger_more_img = 'javascript.0.notify.telegram.cam.trigger_more_img'; // Datenpunkt zur Abfrage weiterer Bilder (wird bei Bedarf automatisch angelegt)
var disable = 'javascript.0.notify.telegram.cam.disable';   // Aktivierung/Deaktivierung des Versands per telegram (wird bei Bedarf automatisch angelegt)
var interval = '3000';  // Verzögerung der weiteren Aufnahmen in Millisekunden
var img_path = '/opt/iobroker/temp/cam/';   // Pfad zum lokalen Speicherort der aufgenommenen Bilder. Bilder werden bei jeder Auslösung überschrieben. Pfad muss schon vorhanden sein!
 
 
// -------------------------------------------
// Ab hier braucht in der Regel nichts mehr geändert zu werden. Also Finger weg wenn du nicht weißt was du tust. :) 
// -------------------------------------------
 
// Datenpunkte anlegen (Kann unter Umständen auskommentiert werden, wenn die Datenpunkte manuell angelegt wurden.)
createState( trigger_auto, false, {name: 'Datenpunkt zur autmatischen Auslösung'});
createState( trigger_manu, false, {name: 'Datenpunkt zur manuellen Auslösung'});
createState( trigger_more_img, false, {name: 'Datenpunkt zur Abfrage weiterer Bilder'});
createState( disable, false, {name: 'Aktivierung/Deaktivierung des Versands per telegram'});
 
// Variablendeklaration und Initialisierung bei Scriptstart
var stateTrigger_auto = getState(trigger_auto).val;
var stateTrigger_manu = getState(trigger_manu).val;
var stateTrigger_more_img = getState(trigger_more_img).val;
var stateDisable = getState(disable).val;
var request = require('request');
var fs      = require('fs');
var timer;
 
 
// Funktionen
// -------------------------------------------
 
// Funktion Bilder versenden
function sendImage (pfad) {
    setTimeout(function() {
        sendTo('telegram.0', {
    text:   pfad,
    reply_markup: {
        keyboard: [
            ['Mehr Bilder', 'Danke']
        ],
        resize_keyboard:   true,
        one_time_keyboard: true
    }
});
        log('Webcam Bild per telegram verschickt.');
    }, 2000);
}
 
// Funktion Bilder speichern
function saveImage() {
    request.get({url: cam_img, encoding: 'binary'}, function (err, response, body) {
        fs.writeFile(img_path + 'cam1_1.jpg', body, 'binary', function(err) {
        if (err) {
            log('Fehler beim Speichern von Bild 1: ' + err, 'warn');
        } else {
            log('Bild 1 gespeichert.');
            sendImage(img_path + 'cam1_1.jpg');
        }
      }); 
    });
     
    if (timer) {
        clearTimeout(timer);
        timer = null;
    } 
    timer = setTimeout(function () {
        request.get({url: cam_img, encoding: 'binary'}, function (err, response, body) {
            fs.writeFile(img_path + 'cam1_2.jpg', body, 'binary', function(err) {
            if (err) {
                log('Fehler beim Speichern von Bild 2: ' + err, 'warn');
            } else {
                log('Bild 2 gespeichert.');
        }
      }); 
    });
        }, interval);
    timer = setTimeout(function () {
        request.get({url: cam_img, encoding: 'binary'}, function (err, response, body) {
            fs.writeFile(img_path + 'cam1_3.jpg', body, 'binary', function(err) {
            if (err) {
                log('Fehler beim Speichern von Bild 3: ' + err, 'warn');
            } else {
                log('Bild 3 gespeichert.');        }
      }); 
    });
        }, 2 * interval);
}
 
 
// Trigger für die verschiedenen Aktionen
// -------------------------------------------
 
// trigger_auto
on(trigger_auto, function(dp) {
    stateTrigger_auto = dp.newState.val;
    stateDisable = getState(disable).val;
    if (stateTrigger_auto === true && stateDisable === false) {
        saveImage();
        // setState(trigger_auto, false);     // Option zum Zurücksetzen des Triggers. Standardmäßig auskommentiert, da sich der Bewegungsmelder automatisch zurück setzt. Bei Bedarf "//" am Zeilenafang entfernen.
    }
});
 
// trigger_more_img
on(trigger_more_img, function(dp) {
    stateTrigger_more_img = dp.newState.val;
    if (stateTrigger_more_img === true) {
        sendImage(img_path + 'cam1_2.jpg');
        sendImage(img_path + 'cam1_3.jpg');
        setState(trigger_more_img, false);
    }
});
 
// trigger_manu
on(trigger_manu, function(dp) {
    stateTrigger_manu = dp.newState.val;
    if (stateTrigger_manu === true) {
        saveImage();
        setState(trigger_manu, false);
    }
});
