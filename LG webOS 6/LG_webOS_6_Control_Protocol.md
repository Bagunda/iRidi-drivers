# LG webOS 6.0 Control Protocol (Summary)

This document is a structured reference for controlling LG Digital Signage displays running webOS 6.0 over RS-232 or LAN. It is intended for use by developers and LLMs for quick parsing.

---

## General Command Structure

- **Command format (ASCII-based)**:  
  `(Command1)(Command2)( )(Set ID)( )(Data)(CR)`

- **Response (ACK)**:  
  `(Command2)( )(Set ID)( )(OK/NG)(Data)(x)`

- **Set ID**:  
  Range `01` to `3E8` (1 to 1000). Use `00` for broadcast (no ACK returned).

- **Carriage Return**: `` (ASCII 0x0D)

---

## Example: Power ON
**Send:** `ka 01 01\r`  
**Response:** `a 01 OK01x`

---

## Core Commands

| #  | Command | Description                     | Data Values               |
|----|---------|---------------------------------|---------------------------|
| 01 | `ka`    | Power ON/OFF                    | `00`: OFF, `01`: ON, `02`: Restart |
| 02 | `xb`    | Input selection                 | See input list below      |
| 03 | `kc`    | Screen aspect ratio             | `02`: Full, `06`: Original |
| 04 | `jq`    | Brightness preset               | `00` to `04`              |
| 05 | `dx`    | Picture mode                    | `00` to `12`              |
| 06 | `kg`    | Contrast                        | `00` to `64` (0–100)      |
| 07 | `kh`    | Brightness                      | `00` to `64` (0–100)      |
| 08 | `kk`    | Sharpness                       | `00` to `32`              |
| 09 | `ki`    | Color                           | `00` to `64`              |
| 10 | `kj`    | Tint                            | `00` to `64`              |
| 14 | `ke`    | Mute                            | `00`: Mute ON, `01`: OFF  |
| 15 | `kf`    | Volume                          | `00` to `64`              |
| 21 | `fk`    | Factory reset                   | `00`: Reset screen, `02`: Full reset |
| 34 | `kd`    | Screen ON/OFF                   | `00`: ON, `01`: OFF       |
| 35 | `dd`    | Video Wall (Tile Mode)          | `00`–`FF` (ColRow bytes)  |
| 37 | `di`    | Tile ID                         | `01`–`E1` (1–225)         |
| 51 | `tr`    | Power state mode                | `00`: LST, `01`: STD, `02`: PWR |
| 52 | `fw`    | Wake-on-LAN (WOL)               | `00`: OFF, `01`: ON       |

---

## Input Source Codes for `xb` Command

| Hex | Input                             |
|------|----------------------------------|
| 20   | AV                               |
| 40   | Component                        |
| 60   | RGB                              |
| 70   | DVI-D (PC)                       |
| 80   | DVI-D (DTV)                      |
| 90   | HDMI1 (DTV)                      |
| A0   | HDMI1 (PC)                       |
| 91   | HDMI2 (DTV)                      |
| A1   | HDMI2 (PC)                       |
| 92   | OPS/HDMI3/DVI-D (DTV)            |
| A2   | OPS/HDMI3/DVI-D (PC)             |
| 95   | OPS/DVI-D (DTV)                  |
| A5   | OPS/DVI-D (PC)                   |
| 96   | HDMI3/DVI-D (DTV)                |
| A6   | HDMI3/DVI-D (PC)                 |
| 97   | HDMI3/HDMI2/DVI-D (DTV)          |
| A7   | HDMI3/HDMI2/DVI-D (PC)           |
| 98   | OPS (DTV)                        |
| A8   | OPS (PC)                         |
| 99   | HDMI2/OPS (DTV)                  |
| A9   | HDMI2/OPS (PC)                   |
| C0   | DisplayPort (DTV)                |
| D0   | DisplayPort (PC)                 |
| C1   | DisplayPort/USB-C (DTV)          |
| D1   | DisplayPort/USB-C (PC)           |
| C2   | HDMI3 (DTV)                      |
| D2   | HDMI3 (PC)                       |
| C3   | HDBaseT (DTV)                    |
| D3   | HDBaseT (PC)                     |
| C5   | USB-C (DTV)                      |
| D5   | USB-C (PC)                       |
| E0   | SuperSign Player (WebOS)         |
| E2   | Multi-screen mode                |
| E3   | URL playback                     |
| E8   | SI application                   |
| F0   | SDI 1                            |
| F2   | SDI 3                            |
| F3   | SDI 4                            |
| F4   | Dual Link SDI 1+2                |
| F5   | Dual Link SDI 3+4                |
| F6   | Qual Link: Auto                  |
| F7   | Qual Link: 2SI                   |
| F8   | Qual Link: Square                |
| F9   | SDI Quad View                    |

---

## Notes

- Use `FF` as data byte to query current state (e.g., `ka 01 FF`)
- Responses with `NG` indicate errors or unsupported commands
- Some commands may not be available on all models
- Wake-on-LAN must be enabled in network settings for LAN control

---

## Reference

Derived from: LG webOS 6.0 Control Protocol PDF, command pages 87–107.
