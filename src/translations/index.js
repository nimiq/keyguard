const TRANSLATIONS = {
    en: {
        _language: 'English',
        loading: 'Loading...',
        continue: 'Continue',

        'passphrase-strength': 'Strength',
        'passphrase-placeholder': 'Enter passphrase',
        'passphrase-repeat-placeholder': 'Repeat passphrase',

        'set-passphrase-heading': 'Set a passphrase',
        'set-passphrase-subheading': 'Please enter a passphrase to secure your account.',
        'set-passphrase-confirm': 'Confirm',

        'privacy-agent-heading': 'Are you being watched?',
        'privacy-agent-info': 'Now is the perfect time to assess your surroundings. Nearby windows? Hidden cameras? '
                            + 'Shoulder spies?',
        'privacy-agent-warning': 'Anyone that can see your Recovery Words can steal all your funds!',
        'privacy-agent-ok': 'OK, all good',

        'recovery-words-title': 'Recovery Words',
        'recovery-words-input-label': 'Recovery Words',
        'recovery-words-input-field-placeholder': 'word #',

        'create-choose-identicon-heading': 'Choose Your Account Avatar',
        'create-backup-account-heading': 'Backup your Account',

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
    },
    de: {
        _language: 'Deutsch',
        loading: 'Wird geladen...',
        continue: 'Weiter',

        'passphrase-strength': 'Stärke',
        'passphrase-placeholder': 'Passphrase eingeben',
        'passphrase-repeat-placeholder': 'Passphrase wiederholen',

        'set-passphrase-heading': 'Lege ein Passwort fest',
        'set-passphrase-subheading': 'Bitte gib ein Passwort ein, um dein Konto zu sichern.',
        'set-passphrase-confirm': 'Bestätigen',

        'privacy-agent-heading': 'Werden sie beobachtet?',
        'privacy-agent-info': 'Jetzt ist eine gute Zeit um sich einmal umzuschauen. Gibt es Fenster in der Nähe? '
                            + ' Versteckte Kameras? Jemand der über die Schulter schaut?',
        'privacy-agent-warning': 'Falls irgendjemand ihre Wiederherstellungswörter herausfindet '
                               + 'kann er ihre gesamten NIM stehlen!',
        'privacy-agent-ok': 'OK, alles in Ordnung',

        'recovery-words-title': 'Wiederherstellungswörter',
        'recovery-words-input-label': 'Wiederherstellungswörter',
        'recovery-words-input-field-placeholder': 'Wort ',

        'create-choose-identicon-heading': 'Wähle einen Avatar für dein Konto',
        'create-backup-account-heading': 'Backup your Account',

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
    },
};

if (typeof module !== 'undefined') module.exports = TRANSLATIONS;
else window.TRANSLATIONS = TRANSLATIONS;
