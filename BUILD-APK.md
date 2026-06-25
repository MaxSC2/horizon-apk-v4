# Сборка APK — ГОРИЗОНТ 4.1.1

## Быстрый старт (рекомендуемый — EAS Build)

Самый простой способ получить APK без установки Android Studio:

```bash
# 1. Установить EAS CLI
npm install -g eas-cli

# 2. Авторизоваться (бесплатный аккаунт expo.dev)
eas login

# 3. Инициализировать
eas build:configure

# 4. Собрать APK (5-10 минут в облаке)
eas build -p android --profile preview
```

Через несколько минут получишь ссылку на скачивание `.apk`.

---

## Локальная сборка (без EAS)

### Требования
- **Node.js 18+**
- **JDK 17** (НЕ 21 — нужен `jlink`)
- **Android SDK** с компонентами:
  - `platform-tools`
  - `platforms;android-34`
  - `build-tools;33.0.2`
  - NDK 26.1.10909125 (ставится автоматически)

### Шаги

```bash
# 1. Распаковать архив
unzip horizon-apk-v4-4.1.1.zip
cd horizon-apk-v4

# 2. Установить зависимости
npm install

# 3. Сгенерировать нативный Android-проект
npx expo prebuild --platform android --no-install

# 4. Указать путь к SDK
echo "sdk.dir=/path/to/Android/Sdk" > android/local.properties

# 5. Собрать release APK
cd android
./gradlew :app:assembleRelease --no-daemon

# 6. Готовый APK
ls app/build/outputs/apk/release/app-release.apk
```

### Если сборка падает с нехваткой памяти

В `android/gradle.properties` увеличь heap:
```
org.gradle.jvmargs=-Xmx4g -XX:MaxMetaspaceSize=1g
```

### Если `jlink does not exist`

Установи JDK 17 (Temurin):
```bash
# macOS
brew install --cask temurin@17

# Linux
sdk install java 17.0.19-tem

# Windows
# скачать с https://adoptium.net/temurin/releases/?version=17
```

И укажи `JAVA_HOME`:
```bash
export JAVA_HOME=/path/to/jdk-17
```

---

## Установка APK на телефон

1. Скачай `.apk` файл на Android-телефон
2. Настройки → Безопасность → **Разрешить установку из неизвестных источников**
3. Открой `.apk` → Установить
4. **Важно при обновлении поверх v4.0**: при первом запуске v4.1 произойдёт
   автоматическая очистка зависших уведомлений будильника. Если будильники
   продолжат приходить — открой Настройки → Будильник → «Сбросить все
   уведомления».

---

## Что делать если будильник не работает

1. **Проверь разрешения**: Настройки телефона → Приложения → Горизонт → Уведомления → разрешить все
2. **Точные будильники** (Android 12+): Настройки → Приложения → Горизонт → Будильники и напоминания → Разрешить
3. **Экономия батареи**: отключи для приложения Горизонт
4. **Panic-кнопка**: в приложении Настройки → Будильник → «Сбросить все уведомления»
5. **Ручная синхронизация**: Настройки → Будильник → «Синхронизировать расписание»

---

## Размер APK

- Release APK: ~25-35 MB (зависит от ABI)
- Universal APK: ~70-90 MB
- Рекомендуется собирать per-ABI APK (меньше размер) через EAS Build.
