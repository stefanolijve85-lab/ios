using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using Game.Core;
using UnityEngine;

namespace Game.Save
{
    /// <summary>
    /// Encrypts player state to <c>Application.persistentDataPath/save_v1.bin</c>. Auto-saves throttled at 5 s.
    /// In production we layer Unity Cloud Save on top via <see cref="CloudSync"/>.
    /// </summary>
    public sealed class SaveService
    {
        private const string FileName = "save_v1.bin";
        private const float ThrottleSeconds = 5f;
        private static readonly byte[] DeviceKey = DeriveKey();

        public SaveData Data { get; private set; } = new SaveData();
        private float _dirtyAt = -1f;
        private readonly string _path;

        public event Action OnSaved;

        public SaveService()
        {
            _path = Path.Combine(Application.persistentDataPath, FileName);
            TryLoad();
        }

        public void MarkDirty() => _dirtyAt = Time.unscaledTime;

        public void Tick()
        {
            if (_dirtyAt < 0) return;
            if (Time.unscaledTime - _dirtyAt < ThrottleSeconds) return;
            SaveSync();
            _dirtyAt = -1f;
        }

        public void SaveSync()
        {
            try
            {
                string json = JsonUtility.ToJson(Data);
                byte[] encrypted = Encrypt(Encoding.UTF8.GetBytes(json));
                File.WriteAllBytes(_path, encrypted);
                OnSaved?.Invoke();
            }
            catch (Exception e)
            {
                Logger.Error($"SaveService: write failed: {e}");
            }
        }

        private void TryLoad()
        {
            try
            {
                if (!File.Exists(_path)) return;
                byte[] cipher = File.ReadAllBytes(_path);
                byte[] plain = Decrypt(cipher);
                string json = Encoding.UTF8.GetString(plain);
                Data = JsonUtility.FromJson<SaveData>(json) ?? new SaveData();
            }
            catch (Exception e)
            {
                Logger.Error($"SaveService: load failed (defaulting): {e}");
                Data = new SaveData();
            }
        }

        // ---- AES-GCM lite (uses AES-CBC + HMAC for broader runtime compatibility) ----
        private static byte[] DeriveKey()
        {
            string seed = SystemInfo.deviceUniqueIdentifier + ":launched_v1_salt";
            using var sha = SHA256.Create();
            return sha.ComputeHash(Encoding.UTF8.GetBytes(seed));
        }

        private static byte[] Encrypt(byte[] plain)
        {
            using var aes = Aes.Create();
            aes.Key = DeviceKey;
            aes.GenerateIV();
            using var enc = aes.CreateEncryptor();
            byte[] body = enc.TransformFinalBlock(plain, 0, plain.Length);
            using var hmac = new HMACSHA256(DeviceKey);
            byte[] mac = hmac.ComputeHash(body);
            using var ms = new MemoryStream();
            ms.Write(aes.IV, 0, aes.IV.Length);
            ms.Write(body, 0, body.Length);
            ms.Write(mac, 0, mac.Length);
            return ms.ToArray();
        }

        private static byte[] Decrypt(byte[] cipher)
        {
            using var aes = Aes.Create();
            aes.Key = DeviceKey;
            byte[] iv = new byte[16]; Array.Copy(cipher, 0, iv, 0, 16);
            int bodyLen = cipher.Length - 16 - 32;
            byte[] body = new byte[bodyLen]; Array.Copy(cipher, 16, body, 0, bodyLen);
            byte[] mac = new byte[32]; Array.Copy(cipher, 16 + bodyLen, mac, 0, 32);
            using var hmac = new HMACSHA256(DeviceKey);
            byte[] expectedMac = hmac.ComputeHash(body);
            if (!CryptoEquals(expectedMac, mac)) throw new InvalidOperationException("Save tampered");
            aes.IV = iv;
            using var dec = aes.CreateDecryptor();
            return dec.TransformFinalBlock(body, 0, body.Length);
        }

        private static bool CryptoEquals(byte[] a, byte[] b)
        {
            if (a.Length != b.Length) return false;
            int diff = 0;
            for (int i = 0; i < a.Length; i++) diff |= a[i] ^ b[i];
            return diff == 0;
        }
    }
}
