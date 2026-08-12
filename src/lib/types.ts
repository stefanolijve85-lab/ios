// Datamodel voor de verlichtingsapp.
//
// Een "Light" is één bedienbaar item in de UI. Achter de schermen kan dat zijn:
//  - een MiBoxer-zone via de Tuya-cloud  (backend: 'tuya')
//  - een losse Hue-lamp via de Hue Bridge (backend: 'hue')
//  - een demo-item dat nergens mee verbindt (backend: 'demo')

export type Backend = 'demo' | 'tuya' | 'hue';

export type LightKind = 'rgbcct' | 'cct' | 'dimmable' | 'onoff';

export interface LightState {
  on: boolean;
  /** 1-100 */
  brightness: number;
  /** kleurtint 0-360 (alleen bij rgbcct) */
  hue: number;
  /** verzadiging 0-100 (alleen bij rgbcct) */
  saturation: number;
  /** kleurtemperatuur in Kelvin, bijv. 2700-6500 (bij cct/rgbcct) */
  kelvin: number;
  /** 'white' toont warm/koud wit, 'color' toont gekleurd licht */
  mode: 'white' | 'color';
}

export interface Light {
  id: string;
  name: string;
  roomId: string;
  backend: Backend;
  kind: LightKind;
  /** icoon-sleutel voor de UI */
  icon?: string;
  /** backend-specifieke verwijzing (Tuya device id + zone, of Hue light id) */
  ref: {
    /** Tuya: device-id van de gateway/controller */
    deviceId?: string;
    /** MiBoxer-zone 1-8 (0 = alle zones) */
    zone?: number;
    /** Hue: v2 light resource id */
    hueId?: string;
    /** DP-codes overschrijven per apparaat, indien afwijkend */
    dp?: Partial<Record<'switch' | 'mode' | 'bright' | 'temp' | 'colour', string>>;
  };
  state: LightState;
}

export interface Room {
  id: string;
  name: string;
  /** emoji of icoon-sleutel */
  icon: string;
  order: number;
}

export interface Scene {
  id: string;
  name: string;
  icon: string;
  /** per light-id een (gedeeltelijke) doelstand */
  targets: Record<string, Partial<LightState>>;
}

export interface TuyaConfig {
  /** Datacenter host, bijv. https://openapi.tuyaeu.com */
  endpoint: string;
  accessId: string;
  accessSecret: string;
}

export interface HueConfig {
  /** IP van de Hue Bridge, bijv. 192.168.1.23 */
  bridgeIp: string;
  /** application key (username) verkregen via de link-knop */
  appKey: string;
}

export interface AppConfig {
  tuya?: TuyaConfig;
  hue?: HueConfig;
  /** demo blijft aan tot een echte backend is gekoppeld */
  demoMode: boolean;
}

export interface AppData {
  rooms: Room[];
  lights: Light[];
  scenes: Scene[];
  config: AppConfig;
}

export const DEFAULT_STATE: LightState = {
  on: false,
  brightness: 100,
  hue: 40,
  saturation: 0,
  kelvin: 4100,
  mode: 'white',
};
