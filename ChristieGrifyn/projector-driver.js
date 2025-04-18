/* 
Драйвер для управления проектором Christie Grifyn.

Протокол:
  - TCP порт 3002. HEX:
    - power on :           '(PWR 1)'
    - power off :          '(PWR 0)'
    - power request:       '(PWR?)'
    - reply (powered on):  '(PWR!001 ...)'
    - reply (powered off): '(PWR!000 "Режим ожидания")'
    - reply (powering off): '(PWR!010)' (только для 4k50-rgb)
    - reply (powering on): '(PWR!011)' (только для 4k50-rgb)

Поддерживаемые модели
  - 4K7-HS (проверено. Отвечает только включен или выключен)
  - 4k50-rgb (провереноа). Команды приходя в формате '(PWR!000 "Режим ожидания")'

Включается за 65 секунд, выключается за 10 секунд

v1.0.0 первый выпуск
*/

function Christie_Grifyn_Driver(device_name){ // Драйвер
    this.pingpong_interval = 1; // Кол-во секунд, через которое посылать запрос о включённости устройства, заодно определяющее, что устройство на связи по протоколу
    this.busy_time_turning_on = 65; // Сколько секунд включается устройство, чтобы показать прогресс бар на интерфейсе
    this.busy_time_turning_off = 10; // Сколько секунд выключается устройство, чтобы показать прогресс бар на интерфейсе

    this.dev = IR.GetDevice(device_name);

    // Протокол обмена
    this.protocol = {
        power_on:           ['(PWR 1)'],
        power_off:          ['(PWR 0)'],
        power_request:      ['(PWR?)'],
        powered_off_reply:  '(PWR!000', // 000 - устройство выключено
        power_on_reply:     '(PWR!001', // 001 - устройство включено
        powering_off_reply: '(PWR!010', // 010 - устройство выключается и охлаждается (только для 4k50-rgb)
        powering_on_reply:  '(PWR!011', // 011 - устройство включается и прогревается (только для 4k50-rgb)
    };

    /**
     * Обработчик принимаемых данных от устройства
     * @private
     * @param {string} text - Полученные данные
     */
    this.on_data = function(text) {
        // IR.Log(this.dev.Name + ": SAY: " + text);
        
        if (text.indexOf(this.protocol.power_on_reply) !== -1){
            IR.SetVariable("Drivers." + this.dev.Name + ".Power_status_text", "включено");
            IR.SetVariable("Drivers." + this.dev.Name + ".Power", 1);
        } else if (text.indexOf(this.protocol.powered_off_reply) !== -1){
            IR.SetVariable("Drivers." + this.dev.Name + ".Power_status_text", "выключено");
            IR.SetVariable("Drivers." + this.dev.Name + ".Power", 0);
        } else if (text.indexOf(this.protocol.powering_off_reply) !== -1){
            IR.SetVariable("Drivers." + this.dev.Name + ".Power_status_text", "выключается");
        } else if (text.indexOf(this.protocol.powering_on_reply) !== -1){
            IR.SetVariable("Drivers." + this.dev.Name + ".Power_status_text", "включается");
        }
    };

    // Регистрация обработчика данных
    IR.AddListener(IR.EVENT_RECEIVE_TEXT, this.dev, this.on_data, this);

    // Прогресс-бар
    this.busy_progress_value = 0;

    // Обработчик прогресс-бара
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
    
    // Остановка прогресс-бара
    this.busy_progress_timer_stop = function() {
        IR.ClearInterval(this.busy_progress_timer);
        this.busy_progress_value = 0;
    }
   
    // Обработчик принимаемых с интерфейса команд
    this.on_serv_channel = function(name, value) { // Обработчик принимаемых команд от драйвера
        // IR.Log(this.dev.Name + ": EVENT_CHANNEL_SET FOR '" + this.dev.Name + "': name=" + name + ", value=" + value);

        switch(name) {
            case "Power on":
                this.power_on_function();
                break;
            case "Power off":
                this.power_off_function();
                break;
            case "Power toggle":
                if (value == 1){
                    this.power_on_function();
                } else if (value == 0){
                    this.power_off_function();
                }
                break;
        }
    };

    // Регистрация обработчика команд
    IR.AddListener(IR.EVENT_CHANNEL_SET, this.dev, this.on_serv_channel, this);

    
    // Действия при включении питания
    this.power_on_function = function() {
        this.dev.Send(this.protocol.power_on);
        IR.SetVariable("Drivers." + this.dev.Name + ".busy", 1);
        this.busy_progress_timer_stop();
        this.busy_progress_timer = IR.SetInterval(this.busy_time_turning_on * 10, this.busy_progress_timer_callback, this);
    }

    // Действия при выключении питания
    this.power_off_function = function() {
        this.dev.Send(this.protocol.power_off);
        IR.SetVariable("Drivers." + this.dev.Name + ".busy", 1);
        this.busy_progress_timer_stop();
        this.busy_progress_timer = IR.SetInterval(this.busy_time_turning_off * 10, this.busy_progress_timer_callback, this);
    }
    
    

    // Отправка запроса статуса питания, одновременно с этим определяем отвечает ли устройство по протоколу. И по этому можно судить что устройство в норме и онлайн
    this.pingpong = function() {
        this.dev.Send(this.protocol.power_request);
    }

    // Обработчик онлайн статуса
    this.on_online = function() {
        IR.Log(this.dev.Name + ": device is online");
        this.pingpong_timer = IR.SetInterval(this.pingpong_interval * 1000, this.pingpong, this);
    };
    
    IR.AddListener(IR.EVENT_ONLINE, this.dev, this.on_online, this);

    // Обработчик офлайн статуса
    this.on_offline = function() {
        IR.Log(this.dev.Name + ": device is offline");
        IR.ClearInterval(this.pingpong_timer);
        IR.SetVariable("Drivers." + this.dev.Name + ".Power_status_text", "Нет соединения");
    };
    
    IR.AddListener(IR.EVENT_OFFLINE, this.dev, this.on_offline, this);
}


var m_Christie_Grifyn_Driver = new Christie_Grifyn_Driver("ChristieGrifyn");
