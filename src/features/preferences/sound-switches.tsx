import { SettingsSwitch } from "@/components/settings-switch";

import { setMusic, setSound, setVibration, usePreferences } from "./preferences-store";

/** Music, sound effects and vibration: the same three switches in Pengaturan and in a room. */
export function SoundSwitches() {
  const music = usePreferences((s) => s.music);
  const sound = usePreferences((s) => s.sound);
  const vibration = usePreferences((s) => s.vibration);
  return (
    <>
      <SettingsSwitch label="Musik" hint="Lagu latar di aplikasi" value={music} onChange={setMusic} />
      <SettingsSwitch label="Efek suara" hint="Tombol, waktu, panggilan host" value={sound} onChange={setSound} />
      <SettingsSwitch label="Getar" hint="Getar saat dipanggil host" value={vibration} onChange={setVibration} last />
    </>
  );
}
