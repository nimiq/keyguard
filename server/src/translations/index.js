const TRANSLATIONS = {
    en: {
        _language: 'English',
        loading: 'Loading...',
        'passphrase-strength': 'Strength',
        'passphrase-confirm': 'Confirm',
        'passphrase-placeholder': 'Enter Passphrase',
        'repeat-passphrase-placeholder': 'Repeat Passphrase',

        'sign-tx-wrong-passphrase': 'Wrong Passphrase, please try again',
        'sign-tx-header': 'Authorize Transaction',
        'sign-tx-byline': 'Please confirm the following transaction:',
        'sign-tx-byline-passphrase': 'Enter your passphrase below to authorize this transaction:',
        'sign-tx-error-wrong-passphrase': 'Wrong Passphrase, please try again',
        'sign-tx-button-confirm': 'Confirm transaction',
        'sign-tx-incl': 'incl.',
        'sign-tx-fee': 'fee',

        'privacy-agent-headline': 'Are you being watched?',
        'privacy-agent-info': 'Now is the perfect time to assess your surroundings. Nearby windows? Hidden cameras? '
                            + 'Shoulder spies?',
        'privacy-agent-warning': 'Anyone that can see your Recovery Words can steal all your funds!',
        'privacy-agent-ok': 'OK, all good',
        'recovery-words-input-label': 'Recovery Words',
        'recovery-words-input-field-placeholder': 'word #',
        'create-choose-identicon-header1': 'Choose Your Account Avatar',
        'create-backup-account-header': 'Backup your Account',
        'create-set-passphrase-header1': 'Set a Passphrase',
        'create-set-passphrase-header2': 'Please enter a Passphrase to secure your account.',
        'create-set-passphrase-warning': 'The Passphrase is [strong]not[/strong] an alternative for your 24 Recovery '
                                       + 'Words!',
        'create-confirm-passphrase': 'Please repeat your Passphrase:',
        'create-choose-pin': 'Choose your PIN',
        'create-enter-account-control-pin': 'Please enter an account control PIN',
        'create-pin-warning': 'Careful, this PIN is [strong]not recoverable![/strong] If you lose it, you lose access '
                            + 'to your funds.',
        'create-confirm-pin': 'Please repeat PIN to confirm',
        'create-pin-not-matching': 'PIN not matching. Please try again.',
        'import-heading': 'Import from Recovery Words',
        'import-words-subheading': 'Please enter your 24 Account Recovery Words.',
        'import-passphrase-subheading': 'Please enter a Passphrase to secure your key.',
        'import-confirm-subheading': 'Please repeat your Passphrase:',
        'recovery-words-title': 'Recovery Words',

        'tx-from': 'From',
        'tx-to': 'To',
        'tx-data': 'Data',

        'import-file-heading': 'Import Access File',
        'import-file-enter-passphrase-heading': 'Enter your Passphrase',
        'import-file-enter-passphrase-subheading': 'Please enter your Passphrase to unlock your Account Access File.',
        'import-file-enter-pin-heading': 'Enter your PIN',
        'import-file-enter-pin-subheading': 'Please enter your PIN to unlock your Account Access File.',
    },
    de: {
        _language: 'Deutsch',
        loading: 'Wird geladen...',
        'passphrase-strength': 'Stärke',
        'passphrase-confirm': 'Bestätigen',
        'passphrase-placeholder': 'Passphrase eingeben',
        'repeat-passphrase-placeholder': 'Passphrase wiederholen',

        'sign-tx-wrong-passphrase': 'Falsche Passphrase, bitte versuche es nochmal',
        'sign-tx-header': 'Überweisung Authorisieren',
        'sign-tx-byline': 'Bitte bestätige die folgende Überweisung:',
        'sign-tx-byline-passphrase': 'Bitte geb deine Passphrase ein, um die Überweisung zu bestätigen:',
        'sign-tx-error-wrong-passphrase': 'Falsche Passphrase, bitte versuche es nochmal',
        'sign-tx-button-confirm': 'Überweisung bestätigen',
        'sign-tx-incl': 'inkl.',
        'sign-tx-fee': 'Gebühr',

        'privacy-agent-headline': 'Werden sie beobachtet?',
        'privacy-agent-info': 'Jetzt ist eine gute Zeit um sich einmal umzuschauen. Gibt es Fenster in der Nähe? '
                            + ' Versteckte Kameras? Jemand der über die Schulter schaut?',
        'privacy-agent-warning': 'Falls irgendjemand ihre Wiederherstellungswörter herausfindet '
                               + 'kann er ihre gesamten NIM stehlen!',
        'privacy-agent-ok': 'OK, alles in Ordnung',
        'recovery-words-input-label': 'Wiederherstellungswörter',
        'recovery-words-input-field-placeholder': 'Wort ',
        'create-choose-identicon-header1': 'Wähle einen Avatar für dein Konto',
        'create-set-passphrase-header1': 'Lege eine Passphrase fest',
        'create-set-passphrase-header2': 'Bitte gib eine Passphrase ein, um dein Konto zu sichern.',
        'create-set-passphrase-warning': 'Die Passphrase ist [strong]keine[/strong] Alternative für deine 24 '
                                       + 'Wiederherstellungswörter!',
        'create-confirm-passphrase': 'Bitte Passphrase wiederholen:',
        'create-choose-pin': 'PIN wählen',
        'create-enter-account-control-pin': 'Bitte gib eine PIN für dein Konto ein',
        'create-pin-warning': 'Vorsicht, die PIN ist [strong]nicht wiederherstellbar![/strong] Falls sie sie '
                            + 'verlieren, verlieren sie auch den Zugang zu ihrem Guthaben!',
        'create-confirm-pin': 'Zur Bestätigung, bitte PIN wiederholen',
        'create-pin-not-matching': 'PIN stimmt nicht überein. Bitte noch einmal versuchen.',
        'import-heading': 'Mit Wiederherstellungswörtern importieren.',
        'import-words-subheading': 'Bitte gib deine 24 Wiederherstellungswörter ein.',
        'import-passphrase-subheading': 'Bitte gib eine Passphrase ein, um deinen Schlüssel zu schützen.',
        'import-confirm-subheading': 'Bitte wiederhole deine Passphrase.',
        'recovery-words-title': 'Wiederherstellungswörter',

        'tx-from': 'Von',
        'tx-to': 'An',
        'tx-data': 'Daten',

        'import-file-heading': 'Zugangsdatei Import',
        'import-file-enter-passphrase-heading': 'Gib deine Passphrase ein',
        'import-file-enter-passphrase-subheading': 'Bitte gib deine Passphrase ein um deine Zugangsdatei zu '
                                                 + 'entschlüsseln',
        'import-file-enter-pin-heading': 'Gib deine PIN ein',
        'import-file-enter-pin-subheading': 'Bitte gib deine PIN ein um deine Zugangsdatei zu entschlüsseln.',
    },
};

// I guess for future use?
//if (typeof module !== 'undefined') module.exports = TRANSLATIONS;
//else
window.TRANSLATIONS = TRANSLATIONS;
