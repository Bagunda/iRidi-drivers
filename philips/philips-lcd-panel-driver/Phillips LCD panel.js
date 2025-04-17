/* 
Драйвер для управления ЖК панелями Philips. Проверено для: 43BDL3550Q/00.
  Протокол:
    TCP порт 5000. HEX:
        power on : 06 01 00 18 02 1D
        power off : 06 01 00 18 01 1E
        get power: 05 01 00 19 1D
        reply (powered on): 06 01 01 19 02 1D
        reply (powered off): 06 01 01 19 01 1E

        Включается за 40 секунд, выключается за 8 секунд

v1.0.0 первый выпуск
*/

var Philips1 = new Phillips_Driver("Philips 1"); 
var Philips2 = new Phillips_Driver("Philips 2"); 
var Philips3 = new Phillips_Driver("Philips 3"); 
var Philips4 = new Phillips_Driver("Philips 4");

function Phillips_Driver(device_name){
    // Константы
    this.pingpong_interval     = 5; // Кол-во секунд, через которое посылать запрос информации для определения, что устройство на связи по протоколу и запрос статуса включенности
    this.busy_time_turning_on  = 40; // Сколько секунд включается устройство, чтобы показать прогресс бар на интерфейсе
    this.busy_time_turning_off = 8; // Сколько секунд выключается устройство, чтобы показать прогресс бар на интерфейсе

    this.dev = IR.GetDevice(device_name);

    // Протокол обмена
    this.protocol = {
        power_on: [0x06, 0x00, 0x00, 0x18, 0x02, 0x1C],
        power_off: [0x06, 0x00, 0x00, 0x18, 0x01, 0x1F], 
        get_power: [0x05, 0x01, 0x00, 0x19, 0x1D],
        reply_powered_on: [0x06, 0x01, 0x01, 0x19, 0x02, 0x1D],
        reply_powered_off: [0x06, 0x01, 0x01, 0x19, 0x01, 0x1E]
    };

    // Отправка запроса статуса питания, одновременно с этим определяем отвечает ли устройство по протоколу. И по этому можно судить что устройство в норме и онлайн
    this.pingpong_send = function() {
        this.dev.Send(this.protocol.get_power);
    }
    
    this.pingpong_timer = IR.SetInterval(this.pingpong_interval * 1000, this.pingpong_send, this);

    // Обработчик принимаемых данных
    this.on_data = function(data) {
        // IR.Log(this.dev.Name + ": SAY: " + data + ", type=" + typeof(data));
        
        // Сравниваем массивы
        if (JSON.stringify(data) === JSON.stringify(this.protocol.reply_powered_on)){
            IR.SetVariable("Drivers." + this.dev.Name + ".Power", 1);
        } else if (JSON.stringify(data) === JSON.stringify(this.protocol.reply_powered_off)){
            IR.SetVariable("Drivers." + this.dev.Name + ".Power", 0);
        }
    };

    IR.AddListener(IR.EVENT_RECEIVE_DATA, this.dev, this.on_data, this);


    // Прогресс-бар
    this.busy_progress_value = 0;

    // Обработчик прогресс-бара, который при срабатывании 100 раз заполнит прогресс-бар на 100. Поэтому управляем частотой срабатывания
    this.busy_progress_timer_callback = function() {
        IR.SetVariable("Drivers." + this.dev.Name + ".busy_progress_timer", this.busy_progress_value);
        this.busy_progress_value = this.busy_progress_value + 1;
        if (this.busy_progress_value > 100){
            this.busy_progress_value = 0;
            IR.ClearInterval(this.busy_progress_timer);
            IR.SetVariable("Drivers." + this.dev.Name + ".busy", 0);
            IR.SetVariable("Drivers." + this.dev.Name + ".busy_progress_timer", 0);
        }
    }
    
    this.busy_progress_timer_stop = function() {
        IR.ClearInterval(this.busy_progress_timer);
        this.busy_progress_value = 0;
    }


    // Обработчик принимаемых с интерфейса команд
    this.on_serv_channel = function(name, value) {
        // IR.Log(this.dev.Name + ": EVENT_CHANNEL_SET: name=" + name + ", value=" + value);
        switch(name) {
            case "Power on":
                // this.dev.Send([0x06, 0x00, 0x00, 0x18, 0x01, 0x1F]);
                IR.GetDevice(device_name).Send(this.protocol.power_on);
                IR.SetVariable("Drivers." + this.dev.Name + ".busy", 1);
                this.busy_progress_timer_stop();
                this.busy_progress_timer = IR.SetInterval(this.busy_time_turning_on * 10, this.busy_progress_timer_callback, this);
                break;
            case "Power off":
                // this.dev.Send([0x06, 0x00, 0x00, 0x18, 0x01, 0x1F]);
                IR.GetDevice(device_name).Send(this.protocol.power_off);
                IR.SetVariable("Drivers." + this.dev.Name + ".busy", 1);
                this.busy_progress_timer_stop();
                this.busy_progress_timer = IR.SetInterval(this.busy_time_turning_off * 10, this.busy_progress_timer_callback, this);
                break;
            case "Power onoff":
                if (value == 0){
                    IR.GetDevice(device_name).Send(this.protocol.power_off);
                    IR.SetVariable("Drivers." + this.dev.Name + ".busy", 1);
                    this.busy_progress_timer_stop();
                    this.busy_progress_timer = IR.SetInterval(this.busy_time_turning_off * 10, this.busy_progress_timer_callback, this);
                } else if (value == 1){
                    IR.GetDevice(device_name).Send(this.protocol.power_on);
                    IR.SetVariable("Drivers." + this.dev.Name + ".busy", 1);
                    this.busy_progress_timer_stop();
                    this.busy_progress_timer = IR.SetInterval(this.busy_time_turning_on * 10, this.busy_progress_timer_callback, this);
                }
                break;
        }
    };

    IR.AddListener(IR.EVENT_CHANNEL_SET, this.dev, this.on_serv_channel, this);


    this.on_online = function() {
        IR.Log(this.dev.Name + ": device is online");
        this.online_status_init();
        
    };
    
    IR.AddListener(IR.EVENT_ONLINE, this.dev, this.on_online, this);


    this.on_offline = function() {
        IR.Log(this.dev.Name + ": device offline");
    };
    
    IR.AddListener(IR.EVENT_OFFLINE, this.dev, this.on_offline, this);


    this.on_start = function() {
    };
    
    IR.AddListener(IR.EVENT_START, 0, this.on_start, this);


}


