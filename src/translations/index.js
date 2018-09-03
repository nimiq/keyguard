const TRANSLATIONS = {
    en: {
        _language: 'English',
        loading: 'Loading...',
        continue: 'Continue',

        'passphrase-strength': 'Strength',
        'passphrase-placeholder': 'Enter passphrase',
        'passphrase-repeat-placeholder': 'Repeat passphrase',

        'privacy-warning-heading': 'Are you being watched?',
        'privacy-warning-text': 'Now is the perfect time to assess your surroundings. '
                              + 'Nearby windows? Hidden cameras? Shoulder spies? '
                              + 'Anyone with your backup phrase can access and spend your NIM.',
        'privacy-agent-continue': 'Continue',

        'recovery-words-title': 'Recovery Words',
        'recovery-words-input-label': 'Recovery Words',
        'recovery-words-input-field-placeholder': 'word #',

        'create-heading-choose-identicon': 'Choose your account avatar',
        'create-text-select-avatar': 'Select an avatar for your wallet\'s default account from the selection below.',
        'create-hint-more-accounts': 'You can add more accounts later.',
        'create-heading-keyfile': 'This is your Key File',
        'create-text-keyfile-info': 'Your Key File gives you full access to your wallet. '
                                  + 'You\'ll need it everytime you log in.',
        'create-hint-keyfile-password': 'To protect your wallet, first protect it with a password.',
        'create-heading-backup-account': 'Create a backup',

        'enter-recovery-words-heading': 'Import from recovery words',
        'enter-recovery-words-subheading': 'Please enter your 24 recovery words.',

        'import-words-heading': 'Import from recovery words',

        'choose-key-type-heading': 'Choose key type',
        'choose-key-type-subheading': 'We couldn\'t determine the type of your key. Please select it below.',
        'choose-key-type-or': 'or',
        'choose-key-type-legacy-address-heading': 'Single address',
        'choose-key-type-legacy-address-info': 'Created before xx/xx/2018',
        'choose-key-type-bip39-address-heading': 'Multiple addresses',
        'choose-key-type-bip39-address-info': 'Created after xx/xx/2018',

        'import-file-heading': 'Import Access File',
        'import-file-enter-passphrase-heading': 'Enter your passphrase',
        'import-file-enter-passphrase-subheading': 'Please enter your passphrase to unlock your Account Access File.',
        'import-file-enter-pin-heading': 'Enter your PIN',
        'import-file-enter-pin-subheading': 'Please enter your PIN to unlock your Account Access File.',

        'sign-tx-heading': 'New Transaction',
        'sign-tx-includes': 'includes',
        'sign-tx-fee': 'fee',
        'sign-tx-youre-sending': 'You\'re sending',
        'sign-tx-to': 'to',
        'sign-tx-pay-with': 'Pay with',

        'passphrasebox-enter-passphrase': 'Enter your passphrase',
        'passphrasebox-protect-keyfile': 'Protect your keyfile with a password',
        'passphrasebox-repeat-password': 'Repeat your password',
        'passphrasebox-continue': 'Continue',
        'passphrasebox-log-in': 'Log in to your wallet',
        'passphrasebox-log-out': 'Confirm logout',
        'passphrasebox-download': 'Download key file',
        'passphrasebox-confirm-tx': 'Confirm transaction',
        'passphrasebox-password-strength-8': 'Great, that\'s a good password!',
        'passphrasebox-password-strength-10': 'Super, that\'s a strong password!',
        'passphrasebox-password-strength-12': 'Excellent, that\'s a very strong password!',
        'passphrasebox-password-hint': 'Your password should have at least 8 characters.',
        'passphrasebox-password-skip': 'Skip password protection for now',

        'identicon-selector-loading': 'Mixing colors',
        'identicon-selector-button-select': 'Select',
        'identicon-selector-link-back': 'Back',

        'downloadkeyfile-heading-protected': 'Your Key File is protected!',
        'downloadkeyfile-heading-unprotected': 'Your Key File is not protected!',
        'downloadkeyfile-safe-place': 'Store it in a safe place. If you lose it, it cannot be recovered!',
        'downloadkeyfile-download': 'Download Key File',
        'downloadkeyfile-download-anyway': 'Download anyway',
    },
    de: {
        _language: 'Deutsch',
        loading: 'Wird geladen...',
        continue: 'Weiter',

        'passphrase-strength': 'Stärke',
        'passphrase-placeholder': 'Passphrase eingeben',
        'passphrase-repeat-placeholder': 'Passphrase wiederholen',

        'privacy-warning-heading': 'Wirst du beobachtet?',
        'privacy-warning-text': 'Jetzt ist eine gute Zeit um sich umzuschauen. Gibt es Fenster in der Nähe? '
                              + 'Versteckte Kameras? Jemand der über deine Schulter schaut? '
                              + 'Jeder der deine Wiederherstellungswörter hat, kann auf deine NIM zugreifen '
                              + 'und sie ausgeben.',
        'privacy-agent-continue': 'Weiter',

        'recovery-words-title': 'Wiederherstellungswörter',
        'recovery-words-input-label': 'Wiederherstellungswörter',
        'recovery-words-input-field-placeholder': 'Wort ',

        'create-heading-choose-identicon': 'Wähle deinen Konto Avatar',
        'create-text-select-avatar': 'Wähle einen Avatar für den Standard-Account deiner Wallet aus der Auswahl unten.',
        'create-hint-more-accounts': 'Neue Konten kannst du später hinzufügen.',
        'create-heading-keyfile': 'Das ist deine Wallet Datei',
        'create-text-keyfile-info': 'Deine Wallet Datei gibt dir vollen Zugang zu deiner Wallet. '
                                  + 'Du brauchst sie jedesmal wenn du dich einloggst.',
        'create-hint-keyfile-password': 'Um deine Wallet zu schützen, schütze es mit einem Passwort.',
        'create-heading-backup-account': 'Erstelle ein Backup',

        'enter-recovery-words-heading': 'Mit Wiederherstellungswörtern importieren',
        'enter-recovery-words-subheading': 'Bitte gib deine 24 Wiederherstellungswörter ein.',

        'import-words-heading': 'Mit Wiederherstellungswörtern importieren',

        'choose-key-type-heading': 'Schlüsseltyp wählen',
        'choose-key-type-subheading': 'Wir konnten den Typ deines Schlüssels nicht automatisch ermitteln. '
                                    + 'Bitte wähle ihn unten aus.',
        'choose-key-type-or': 'oder',
        'choose-key-type-legacy-address-heading': 'Einzelne Adresse',
        'choose-key-type-legacy-address-info': 'Erstellt vor xx.xx.2018',
        'choose-key-type-bip39-address-heading': 'Mehrere Adressen',
        'choose-key-type-bip39-address-info': 'Erstellt nach xx.xx.2018',

        'import-file-heading': 'Zugangsdatei Import',
        'import-file-enter-passphrase-heading': 'Gib deine Passphrase ein',
        'import-file-enter-passphrase-subheading': 'Bitte gib deine Passphrase ein um deine Zugangsdatei zu '
                                                 + 'entschlüsseln',
        'import-file-enter-pin-heading': 'Gib deine PIN ein',
        'import-file-enter-pin-subheading': 'Bitte gib deine PIN ein um deine Zugangsdatei zu entschlüsseln.',

        'sign-tx-heading': 'Neue Überweisung',
        'sign-tx-includes': 'inklusive',
        'sign-tx-fee': 'Gebühr',
        'sign-tx-youre-sending': 'Du sendest',
        'sign-tx-to': 'an',
        'sign-tx-pay-with': 'Zahle mit',

        'passphrasebox-enter-passphrase': 'Gib deine Passphrase ein',
        'passphrasebox-protect-keyfile': 'Sichere dein KeyFile mit einem Passwort',
        'passphrasebox-repeat-password': 'Wiederhole dein Passwort',
        'passphrasebox-continue': 'Weiter',
        'passphrasebox-log-in': 'In deine Wallet einloggen',
        'passphrasebox-log-out': 'Abmeldung bestätigen',
        'passphrasebox-download': 'KeyFile herunterladen',
        'passphrasebox-confirm-tx': 'Überweisung bestätigen',
        'passphrasebox-password-strength-8': 'Schön, das ist ein gutes Passwort!',
        'passphrasebox-password-strength-10': 'Super, das ist ein starkes Passwort!',
        'passphrasebox-password-strength-12': 'Exzellent, das ist ein sehr starkes Passwort!',
        'passphrasebox-password-hint': 'Dein Passwort muss mindestens 8 Zeichen haben.',
        'passphrasebox-password-skip': 'Passwortschutz erstmal überspringen',

        'identicon-selector-loading': 'Mische Farben',
        'identicon-selector-button-select': 'Auswählen',
        'identicon-selector-link-back': 'Zurück',

        'downloadkeyfile-heading-protected': 'Dein Schlüsseldatei ist geschützt!',
        'downloadkeyfile-heading-unprotected': 'Dein Schlüsseldatei ist nicht geschützt!',
        'downloadkeyfile-safe-place': 'Lagere sie in einem sicheren Ort. Wenn du sie verlierst, '
                                    + 'kann sie nicht wiederhergestellt werden!',
        'downloadkeyfile-download': 'Schlüsseldatei herunterladen',
        'downloadkeyfile-download-anyway': 'Trotzdem herunterladen',
    },
};

if (typeof module !== 'undefined') module.exports = TRANSLATIONS;
else window.TRANSLATIONS = TRANSLATIONS;
