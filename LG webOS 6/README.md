# LG webOS 6 Driver for iRidi

A driver for controlling LG webOS 6.0 Digital Signage displays through iRidi automation system.

## Overview

This driver enables control of LG Digital Signage displays running webOS 6.0 via TCP connection. It has been tested on the LG 75UL3J-EP model but should work with other webOS 6.0 compatible displays.

## Features

- **Power Control**: Turn display on/off and reboot
- **Input Selection**: Switch between various inputs (HDMI, DVI, DisplayPort, USB-C, etc.)
- **Status Monitoring**: Real-time power and input status feedback
- **Auto-reconnection**: Automatic status polling and reconnection handling

## Connection

- **Protocol**: TCP
- **Port**: 9761
- **Connection Type**: Persistent connection

## Supported Inputs

The driver supports a wide range of input sources:

- AV, Component, RGB
- DVI-D (PC/DTV modes)
- HDMI 1-3 (PC/DTV modes)
- DisplayPort (PC/DTV modes)
- USB-C (PC/DTV modes)
- HDBaseT (PC/DTV modes)
- OPS (Optional PC/DTV modes)
- SDI inputs (1, 3, 4)
- Dual/Quad Link configurations
- SuperSign WebOS Player
- Multi-screen mode
- URL playback

## Installation

1. Copy `LG.js` to your iRidi project
2. Configure device connection settings:
   - Host: LG display IP address
   - Port: 9761
   - Protocol: TCP

## Usage

### Basic Control

```javascript
// Power control
IR.SetVariable("Drivers.LG_Display.dev:Power", 1); // Power ON
IR.SetVariable("Drivers.LG_Display.dev:Power", 0); // Power OFF

// Reboot
IR.SetVariable("Drivers.LG_Display.dev:Reboot", 1);

// Input selection
IR.SetVariable("Drivers.LG_Display.dev:Input", "90"); // HDMI1 (DTV)
IR.SetVariable("Drivers.LG_Display.dev:Input", "A0"); // HDMI1 (PC)
```

### Status Variables

The driver provides feedback through these variables:

- `Drivers.[DeviceName].dev:Power` - Current power state (0/1)
- `Drivers.[DeviceName].dev:Input` - Current input code
- `Drivers.[DeviceName].dev:HDMI1` - HDMI1 status indicator (0/1)

## Input Codes Reference

| Code | Input Source |
|------|-------------|
| 20 | AV |
| 40 | Component |
| 60 | RGB |
| 70 | DVI-D (PC) |
| 80 | DVI-D (DTV) |
| 90 | HDMI1 (DTV) |
| A0 | HDMI1 (PC) |
| 91 | HDMI2 (DTV) |
| A1 | HDMI2 (PC) |
| 92 | HDMI3/OPS (DTV) |
| A2 | HDMI3/OPS (PC) |
| C0 | DisplayPort (DTV) |
| D0 | DisplayPort (PC) |
| C5 | USB-C (DTV) |
| D5 | USB-C (PC) |
| E0 | SuperSign WebOS Player |

*For complete input codes reference, see the comments in LG.js*

## Configuration

The driver creates instances for multiple displays:

```javascript
var LG_left_mod = new LG_Driver("LG left");
var LG_right_mod = new LG_Driver("LG right");
```

Modify device names according to your setup.

## Troubleshooting

- Ensure the display's network settings allow TCP connections on port 9761
- Check that the display's "Network" → "LG Connect Apps" → "IP Control" is enabled
- Verify firewall settings on both iRidi server and display
- Monitor console logs for connection status and error messages

## Protocol Documentation

For detailed protocol information, refer to `LG_webOS_6_Control_Protocol.md`.

## Tested Hardware

- LG 75UL3J-EP (webOS 6.0)

## License

This driver is provided as-is for educational and development purposes.

## Contributing

Feel free to submit issues and pull requests for improvements and additional device support. 