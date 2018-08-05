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

        'sign-tx-wrong-passphrase': 'Wrong Passphrase, please try again',
        'sign-tx-heading': 'Authorize Transaction',
        'sign-tx-subheading': 'Please confirm the following transaction:',
        'sign-tx-error-wrong-passphrase': 'Wrong Passphrase, please try again',
        'sign-tx-button-confirm': 'Confirm transaction',
        'sign-tx-incl': 'incl.',
        'sign-tx-fee': 'fee',

        'tx-from': 'From',
        'tx-to': 'To',
        'tx-data': 'Data',

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

        'sign-tx-wrong-passphrase': 'Falsche Passphrase, bitte versuche es nochmal',
        'sign-tx-heading': 'Überweisung Authorisieren',
        'sign-tx-subheading': 'Bitte bestätige die folgende Überweisung:',
        'sign-tx-error-wrong-passphrase': 'Falsche Passphrase, bitte versuche es nochmal',
        'sign-tx-button-confirm': 'Überweisung bestätigen',
        'sign-tx-incl': 'inkl.',
        'sign-tx-fee': 'Gebühr',

        'tx-from': 'Von',
        'tx-to': 'An',
        'tx-data': 'Daten',
    },
};

if (typeof module !== 'undefined') module.exports = TRANSLATIONS;
else window.TRANSLATIONS = TRANSLATIONS;
