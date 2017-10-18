; *** Inno Setup version 5.5.3+ Croatian messages ***
; Translated by: Elvis Gambira�a (el.gambo@gmail.com)
; Based on translation by Krunoslav Kanjuh (krunoslav.kanjuh@zg.t-com.hr)
;
; To download user-contributed translations of this file, go to:
; http://www.jrsoftware.org/files/istrans/
;
; Note: When translating this text, do not add periods (.) to the end of
; messages that didn't have them already, because on those messages Inno
; Setup adds the periods automatically (appending a period would result in
; two periods being displayed).

[LangOptions]
; The following three entries are very important. Be sure to read and 
; understand the '[LangOptions] section' topic in the help file.
LanguageName=Hrvatski
LanguageID=$041a
LanguageCodePage=1250
; If the language you are translating to requires special font faces or
; sizes, uncomment any of the following entries and change them accordingly.
;DialogFontName=MS Shell Dlg
;DialogFontSize=8
;WelcomeFontName=Arial
;WelcomeFontSize=12
;TitleFontName=Arial
;TitleFontSize=29
;CopyrightFontName=Arial
;CopyrightFontSize=8

[Messages]

; *** Application titles
SetupAppTitle=Instalacija
SetupWindowTitle=Instalacija - %1
UninstallAppTitle=Deinstalacija
UninstallAppFullTitle=Deinstalacija programa %1

; *** Misc. common
InformationTitle=Informacija
ConfirmTitle=Potvrda
ErrorTitle=Gre�ka

; *** SetupLdr messages
SetupLdrStartupMessage=Zapo�eli ste instalaciju programa %1. �elite li nastaviti?
LdrCannotCreateTemp=Ne mogu kreirati privremenu datoteku. Instalacija je prekinuta.
LdrCannotExecTemp=Ne mogu pokrenuti datoteku u privremenoj mapi. Instalacija je prekinuta.

; *** Startup error messages
LastErrorMessage=%1.%n%nGre�ka %2: %3
SetupFileMissing=Datoteka %1 se ne nalazi u instalacijskoj mapi. Ispravite problem ili nabavite novu kopiju programa.
SetupFileCorrupt=Instalacijske datoteke su o�te�ene. Nabavite novu kopiju programa.
SetupFileCorruptOrWrongVer=Instalacijske datoteke su o�te�ene, ili nisu kompatibilne s ovom verzijom instalacije. Ispravite problem ili nabavite novu kopiju programa.
InvalidParameter=Neispravan parametar je prenijet na komandnu liniju: %n%n%1
SetupAlreadyRunning=Instalacija je ve� pokrenuta.
WindowsVersionNotSupported=Program ne podr�ava verziju Windowsa koju koristite.
WindowsServicePackRequired=Program zahtijeva %1 servisni paket %2 ili noviji.
NotOnThisPlatform=Ovaj program ne�e raditi na %1.
OnlyOnThisPlatform=Ovaj program se mora pokrenuti na %1.
OnlyOnTheseArchitectures=Ovaj program mo�e biti instaliran na verziji Windowsa dizajniranim za sljede�u procesorsku arhitekturu:%n%n%1
MissingWOW64APIs=Ova verzija Windowsa ne posjeduje funkcije koje zahtjeva instalacija za 64-bitnu instalaciju. Kako bi rije�ili problem instalirajte servisni paket %1.
WinVersionTooLowError=Ovaj program zahtijeva %1 verziju %2 ili noviju.
WinVersionTooHighError=Ovaj program ne mo�e biti instaliran na %1 verziji %2 ili novijoj.
AdminPrivilegesRequired=Morate biti prijavljeni kao administrator prilikom pokretanja ovog programa.
PowerUserPrivilegesRequired=Morate biti prijavljeni kao administrator ili �lan grupe Power Users prilikom instaliranja ovog programa.
SetupAppRunningError=Instalacija je otkrila da je %1 pokrenut.%n%nZatvorite program i potom kliknite Dalje za nastavak ili Odustani za prekid instalacije.
UninstallAppRunningError=Deinstalacija je otkrila da je %1 pokrenut.%n%nZatvorite program i potom kliknite Dalje za nastavak ili Odustani za prekid instalacije.

; *** Misc. errors
ErrorCreatingDir=Instalacija nije mogla kreirati mapu "%1".
ErrorTooManyFilesInDir=Instalacija nije mogla kreirati datoteku u mapi "%1" zato �to ona sadr�i previ�e datoteka.

; *** Setup common messages
ExitSetupTitle=Prekid instalacije
ExitSetupMessage=Instalacija nije zavr�ena. Ako sad iza�ete, program ne�e biti instaliran.%n%nInstalaciju mo�ete pokrenuti kasnije ukoliko ju �elite zavr�iti.%n%nPrekid instalacije?
AboutSetupMenuItem=&O programu
AboutSetupTitle=Podaci o programu
AboutSetupMessage=%1 verzija %2%n%3%n%n%1 home page:%n%4
AboutSetupNote=
TranslatorNote=Translated by: Elvis Gambira�a

; *** Buttons
ButtonBack=< Na&trag
ButtonNext=Na&stavak >
ButtonInstall=&Instaliraj
ButtonOK=&U redu
ButtonCancel=&Otka�i
ButtonYes=&Da
ButtonYesToAll=D&a za sve
ButtonNo=&Ne
ButtonNoToAll=N&e za sve
ButtonFinish=&Zavr�i
ButtonBrowse=&Odaberi...
ButtonWizardBrowse=O&daberi...
ButtonNewFolder=&Kreiraj novu mapu

; *** "Select Language" dialog messages
SelectLanguageTitle=Izaberite jezik
SelectLanguageLabel=Izberite jezik koji �elite koristiti pri instalaciji:

; *** Common wizard text
ClickNext=Kliknite na Nastavak za nastavak ili Otka�i za prekid instalacije.
BeveledLabel=
BrowseDialogTitle=Odabir mape
BrowseDialogLabel=Odaberite mapu iz liste koja slijedi te kliknite OK.
NewFolderName=Nova mapa

; *** "Welcome" wizard page
WelcomeLabel1=Dobro do�li u instalaciju programa [name]
WelcomeLabel2=Ovaj program �e instalirati [name/ver] na va�e ra�unalo.%n%nPreporu�amo da zatvorite sve programe prije nego nastavite dalje.

; *** "Password" wizard page
WizardPassword=Lozinka
PasswordLabel1=Instalacija je za�ti�ena lozinkom.
PasswordLabel3=Upi�ite lozinku i kliknite Nastavak. Lozinke su osjetljive na mala i velika slova.
PasswordEditLabel=&Lozinka:
IncorrectPassword=Upisana je pogre�na lozinka. Poku�ajte ponovo.

; *** "License Agreement" wizard
WizardLicense=Ugovor o kori�tenju
LicenseLabel=Molimo prije nastavka pa�ljivo pro�itajte sljede�e va�ne informacije.
LicenseLabel3=Molimo pa�ljivo pro�itajte Ugovor o kori�tenju. Morate prihvatiti uvjete ugovora kako bi mogli nastaviti s instalacijom.
LicenseAccepted=&Prihva�am ugovor
LicenseNotAccepted=&Ne prihva�am ugovor

; *** "Information" wizard pages
WizardInfoBefore=Informacije
InfoBeforeLabel=Pro�itajte sljede�e va�ne informacije prije nastavka.
InfoBeforeClickLabel=Kada budete spremni nastaviti instalaciju kliknite Nastavak.
WizardInfoAfter=Informacije
InfoAfterLabel=Pro�itajte sljede�e va�ne informacije prije nastavka.
InfoAfterClickLabel=Kada budete spremni nastaviti instalaciju kliknite Nastavak.

; *** "User Information" wizard page
WizardUserInfo=Informacije o korisniku
UserInfoDesc=Upi�ite informacije o vama.
UserInfoName=&Ime korisnika:
UserInfoOrg=&Organizacija:
UserInfoSerial=&Serijski broj:
UserInfoNameRequired=Morate upisati ime.

; *** "Select Destination Location" wizard page
WizardSelectDir=Odaberite odredi�nu mapu
SelectDirDesc=Mapa u koju �e biti instaliran program.
SelectDirLabel3=Instalacija �e instalirati [name] u sljede�u mapu
SelectDirBrowseLabel=Za nastavak kliknite na Nastavak. Ako �elite odabrati drugu mapu kliknite na Odaberi.
DiskSpaceMBLabel=Ovaj program zahtjeva minimalno [mb] MB slobodnog prostora na disku.
CannotInstallToNetworkDrive=Instalacija ne mo�e instalirati na mre�nu jedinicu.
CannotInstallToUNCPath=Instalacija ne mo�e instalirati na UNC putanju.
InvalidPath=Morate unijeti punu stazu zajedno sa slovom diska (npr.%n%nC:\APP%n%nili stazu u obliku%n%n\\server\share)
InvalidDrive=Disk koji ste odabrali ne postoji. Odaberite neki drugi.
DiskSpaceWarningTitle=Nedovoljno prostora na disku
DiskSpaceWarning=Instalacija zahtjeva bar %1 KB slobodnog prostora, a odabrani disk ima samo %2 KB na raspolaganju.%n%n�elite li nastaviti?
DirNameTooLong=Preduga�ak naziv mape ili staze.
InvalidDirName=Naziv mape je pogre�an.
BadDirName32=Naziv mape ne smije sadr�avati niti jedan od sljede�ih znakova nakon to�ke:%n%n%1
DirExistsTitle=Mapa ve� postoji
DirExists=Mapa:%n%n%1%n%nve� postoji. �elite li instalirati u nju?
DirDoesntExistTitle=Mapa ne postoji
DirDoesntExist=Mapa:%n%n%1%n%nne postoji. �elite li ju napraviti?

; *** "Select Components" wizard page
WizardSelectComponents=Odaberite komponente
SelectComponentsDesc=Koje komponente �elite instalirati?
SelectComponentsLabel2=Odaberite komponente koje �elite instalirati, odnosno uklonite kva�icu uz komponente koje ne �elite:
FullInstallation=Puna instalacija

; if possible don't translate 'Compact' as 'Minimal' (I mean 'Minimal' in your language)
CompactInstallation=Kompaktna instalacija
CustomInstallation=Instalacija po izboru
NoUninstallWarningTitle=Postoje�e komponente
NoUninstallWarning=Instalacija je utvrdila da na va�em ra�unalu ve� postoje sljede�e komponente:%n%n%1%n%nNeodabir tih komponenata ne dovodi do njihove deinstalacije.%n%n�elite li ipak nastaviti?
ComponentSize1=%1 KB
ComponentSize2=%1 MB
ComponentsDiskSpaceMBLabel=Va� izbor zahtijeva najmanje [mb] MB prostora na disku.

; *** "Select Additional Tasks" wizard page
WizardSelectTasks=Odaberite zadatke
SelectTasksDesc=Koje dodatne zadatke �elite izvr�iti?
SelectTasksLabel2=Odaberite zadatke koji �e se izvr�iti tijekom instalacije programa [name].

; *** "Select Start Menu Folder" wizard page
WizardSelectProgramGroup=Odaberite programsku grupu
SelectStartMenuFolderDesc=Lokacija pre�ice programa
SelectStartMenuFolderLabel3=Instalacija �e kreirati pre�ice za programe u sljede�oj Start Menu mapi
SelectStartMenuFolderBrowseLabel=Kako bi nastavili, kliknite na Nastavak. Ako �elite odabrati drugu mapu klikni na Odabir.
MustEnterGroupName=Morate unijeti ime programske grupe.
GroupNameTooLong=Predugi naziv mape ili staze.
InvalidGroupName=Naziv mape je pogre�an.
BadGroupName=Ime programske grupe ne smije sadr�avati sljede�e znakove:%n%n%1
NoProgramGroupCheck2=&Ne kreiraj %1 programsku grupu

; *** "Ready to Install" wizard page
WizardReady=Instalacija je spremna
ReadyLabel1=Instalacija je spremna instalirati [name] na va�e ra�unalo.
ReadyLabel2a=Kliknite na Instaliraj ako �elite instalirati program ili na Nazad ako �elite pregledati ili promijeniti postavke.
ReadyLabel2b=Kliknite na Instaliraj ako �elite instalirati program.
ReadyMemoUserInfo=Korisni�ki podaci:
ReadyMemoDir=Odredi�na mapa:
ReadyMemoType=Tip instalacije:
ReadyMemoComponents=Odabrane komponente:
ReadyMemoGroup=Programska grupa:
ReadyMemoTasks=Dodatni zadaci:

; *** "Preparing to Install" wizard page
WizardPreparing=Priprema instalacije
PreparingDesc=Instalacija se priprema za instaliranje [name] na va�e ra�unalo.
PreviousInstallNotCompleted=Instalacija/deinstalacija prethodnog programa nije zavr�ena. Morate restartati ra�unalo kako bi zavr�ili tu instalaciju.%n%nNakon restartanja ra�unala, ponovno pokrenite Setup kako bi dovr�ili instalaciju [name].
CannotContinue=Instalacija ne mo�e nastaviti. Kliknite na Odustani za izlaz.
ApplicationsFound=Sljede�i programi koriste datoteke koje instalacijski program treba a�urirati. Preporu�ujemo da dopustite instalacijskom programu da zatvori ove programe.
ApplicationsFound2=Sljede�i programi koriste datoteke koje instalacijski program treba a�urirati. Preporu�ujemo da dopustite instalacijskom programu da zatvori ove programe.
CloseApplications=&Zatvori programe
DontCloseApplications=&Ne zatvaraj programe
ErrorCloseApplications=Ne mogu zatvoriti sve programe. Prije nego nastavite, preporu�ujemo da zatvorite sve programe koji koriste datoteke koje instalacijski program treba a�urirati.

; *** "Installing" wizard page
WizardInstalling=Instaliranje
InstallingLabel=Pri�ekajte dok ne zavr�i instalacija programa [name] na va�e ra�unalo.

; *** "Setup Completed" wizard page
FinishedHeadingLabel=Zavr�etak instalacije [name]
FinishedLabelNoIcons=Instalacija programa [name] je zavr�ena.
FinishedLabel=Instalacija programa [name] je zavr�ena. Program mo�ete pokrenuti preko instaliranih ikona.
ClickFinish=Kliknite na Zavr�i kako biste iza�li iz instalacije.
FinishedRestartLabel=Kako biste instalaciju programa [name] zavr�ili, potrebno je ponovno pokrenuti ra�unalo. �elite li to sada u�initi?
FinishedRestartMessage=Zavr�etak instalacija programa [name], zahtijeva ponovno pokretanje ra�unala.%n%n�elite li to u�initi sada?
ShowReadmeCheck=Da, �elim pro�itati README datoteku
YesRadio=&Da, �elim sada ponovno pokrenuti ra�unalo
NoRadio=&Ne, kasnije �u ga ponovno pokrenuti

; used for example as 'Run MyProg.exe'
RunEntryExec=&Pokreni %1

; used for example as 'View Readme.txt'
RunEntryShellExec=Pogledaj %1

; *** "Setup Needs the Next Disk" stuff
ChangeDiskTitle=Instalacija treba sljede�i disk
SelectDiskLabel2=Umetnite disketu %1 i kliknite na OK.%n%nAko se datoteke s ove diskete nalaze na nekom drugom mediju %2 , upi�ite ispravnu stazu do njega ili kliknite na Odaberi.
PathLabel=&Staza:
FileNotInDir2=Datoteka "%1" ne postoji u "%2". Molimo ubacite odgovaraju�i disk ili odaberete drugi %3.
SelectDirectoryLabel=Odaberite lokaciju sljede�eg diska.

; *** Installation phase messages
SetupAborted=Instalacija nije zavr�ena.%n%nIspravite problem i opet pokrenite instalaciju.
EntryAbortRetryIgnore=Kliknite na Ponovi za novi poku�aj, Ignoriraj za nastavak, ili Prekid za prekid instalacije.

; *** Installation status messages
StatusClosingApplications=Zatvaram programe...
StatusCreateDirs=Kreiram mape...
StatusExtractFiles=Izdvajam datoteke...
StatusCreateIcons=Kreiram ikone...
StatusCreateIniEntries=Kreiram INI datoteke...
StatusCreateRegistryEntries=Kreiram podatke za registry...
StatusRegisterFiles=Registriram datoteke...
StatusSavingUninstall=Snimam deinstalacijske informacije...
StatusRunProgram=Zavr�avam instalaciju...
StatusRestartingApplications=Ponovo pokre�em programe...
StatusRollback=Poni�tavam promjene...

; *** Misc. errors
ErrorInternal2=Interna gre�ka: %1
ErrorFunctionFailedNoCode=%1 nije uspjelo
ErrorFunctionFailed=%1 nije uspjelo; kod %2
ErrorFunctionFailedWithMessage=%1 nije uspjelo; kod %2.%n%3
ErrorExecutingProgram=Ne mogu pokrenuti datoteku:%n%1

; *** Registry errors
ErrorRegOpenKey=Gre�ka pri otvaranju registry klju�a:%n%1\%2
ErrorRegCreateKey=Gre�ka pri kreiranju registry klju�a:%n%1\%2
ErrorRegWriteKey=Gre�ka pri pisanju u registry klju�:%n%1\%2

; *** INI errors
ErrorIniEntry=Gre�ka pri kreiranju INI podataka u datoteci "%1".

; *** File copying errors
FileAbortRetryIgnore=Kliknite Ponovi za novi poku�aj, Ignoriraj za preskok ove datoteke (ne preporu�a se), ili Prekid za prekid instalacije.
FileAbortRetryIgnore2=Kliknite Ponovi za novi poku�aj, Ignoriraj za nastavak u svakom slu�aju (ne preporu�a se), ili Prekid za prekid instalacije
SourceIsCorrupted=Izvori�na datoteka je o�te�ena
SourceDoesntExist=Izvori�na datoteka "%1" ne postoji
ExistingFileReadOnly=Postoje�a datoteka je ozna�ena "samo-za-�itanje".%n%nKliknite Ponovi kako biste uklonili oznaku "samo-za-�itanje" i poku�ajte ponovno, Ignoriraj za preskok ove datoteke, ili Prekid za prekid instalacije.
ErrorReadingExistingDest=Pojavila se gre�ka prilikom poku�aja �itanja postoje�e datoteke:
FileExists=Datoteka ve� postoji.%n%n�elite li ju zamijeniti?
ExistingFileNewer=Postoje�a datoteka je novija od one koju poku�avate instalirati. Preporu�a se zadr�ati postoje�u datoteku.%n%n�elite li zadr�ati postoje�u datoteku?
ErrorChangingAttr=Pojavila se gre�ka prilikom poku�aja promjene atributa postoje�e datoteke:
ErrorCreatingTemp=Pojavila se gre�ka prilikom poku�aja kreiranja datoteke u odredi�noj mapi:
ErrorReadingSource=Pojavila se gre�ka prilikom poku�aja �itanja izvori�ne datoteke:
ErrorCopying=Pojavila se gre�ka prilikom poku�aja kopiranja datoteke:
ErrorReplacingExistingFile=Pojavila se gre�ka prilikom poku�aja zamjene datoteke:
ErrorRestartReplace=Zamjena nakon ponovnog pokretanja nije uspjela:
ErrorRenamingTemp=Pojavila se gre�ka prilikom poku�aja preimenovanja datoteke u odredi�noj mapi:
ErrorRegisterServer=Ne mogu registrirati DLL/OCX: %1
ErrorRegSvr32Failed=Gre�ka u RegSvr32: gre�ka %1
ErrorRegisterTypeLib=Ne mogu registrirati type library: %1

; *** Post-installation errors
ErrorOpeningReadme=Pojavila se gre�ka prilikom poku�aja otvaranja README datoteke.
ErrorRestartingComputer=Instalacija ne mo�e ponovno pokrenuti ra�unalo. U�inite to ru�no.

; *** Uninstaller messages
UninstallNotFound=Datoteka "%1" ne postoji. Deinstalacija prekinuta.
UninstallOpenError=Datoteku "%1" ne mogu otvoriti. Deinstalacija nije mogu�a.
UninstallUnsupportedVer=Deinstalacijska datoteka "%1" je u formatu koji nije prepoznat od ove verzije deinstalacijskog programa. Nije mogu�a deinstalacija.
UninstallUnknownEntry=Nepoznat zapis (%1) je prona�en u deinstalacijskoj datoteci.
ConfirmUninstall=�elite li zaista ukloniti %1 i sve njegove komponente?
UninstallOnlyOnWin64=Ova instalacija mo�e biti uklonjena samo na 64-bitnim Windowsima.
OnlyAdminCanUninstall=Ova instalacija mo�e biti uklonjena samo od korisnika sa administratorskim pravima.
UninstallStatusLabel=Pri�ekajte dok %1 ne bude uklonjen s va�eg ra�unala.
UninstalledAll=Program %1 je uspje�no uklonjen sa va�eg ra�unala.
UninstalledMost=Deinstalacija programa %1 je zavr�ena.%n%nNeke elemente nije bilo mogu�e ukloniti. U�inite to ru�no.
UninstalledAndNeedsRestart=Kako bi zavr�ili deinstalaciju %1, Va�e ra�unalo morate ponovno pokrenuti%n%n�elite li to u�initi sada? 
UninstallDataCorrupted="%1" datoteka je o�te�ena. Deinstalacija nije mogu�a.

; *** Uninstallation phase messages
ConfirmDeleteSharedFileTitle=Brisanje dijeljene datoteke
ConfirmDeleteSharedFile2=Sistem ukazuje da sljede�e dijeljene datoteke ne koristi niti jedan program. �elite li ukloniti te dijeljene datoteke?%n%nAko neki programi i dalje koriste te datoteke, a one se izbri�u, ti programi ne�e ispravno raditi. Ako niste sigurni, odaberite Ne. Ostavljanje datoteka ne�e uzrokovati �tetu va�em sistemu.
SharedFileNameLabel=Datoteka:
SharedFileLocationLabel=Staza:
WizardUninstalling=Deinstalacija
StatusUninstalling=Deinstaliram %1...
; *** Shutdown block reasons
ShutdownBlockReasonInstallingApp=Instaliram %1.
ShutdownBlockReasonUninstallingApp=Deinstaliram %1.

; The custom messages below aren't used by Setup itself, but if you make
; use of them in your scripts, you'll want to translate them.

[CustomMessages]

NameAndVersion=%1 verzija %2
AdditionalIcons=Dodatne ikone:
CreateDesktopIcon=Kreiraj ikonu na &Desktopu
CreateQuickLaunchIcon=Kreiraj ikonu u traci za brzo pokretanje
ProgramOnTheWeb=%1 na internetu
UninstallProgram=Deinstaliraj %1
LaunchProgram=Pokreni %1
AssocFileExtension=Pridru&�i %1 sa %2 ekstenzijom datoteke
AssocingFileExtension=Pridru�ujem %1 sa %2 ekstenzijom datoteke
AutoStartProgramGroupDescription=Pokretanje:
AutoStartProgram=Automatski pokreni %1
AddonHostProgramNotFound=%1 se ne nalazi u navedenoj mapi.%n%n�elite li svejedno nastaviti?