import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import QRCode from 'qrcode';

interface Document {
  id: string;
  number: string;
  customerName: string;
  customerLastName: string;
  itemDescription: string;
  pickupDate: string;
  recipientPhone: string;
  recipientEmail?: string;
  depositAmount: number;
  pickupAmount: number;
  issuedBy: string;
  issuedAt: Date;
  pickedUpAt?: Date;
  status: 'issued' | 'picked_up';
  qrCode: string;
}

type UserRole = 'cashier' | 'admin' | 'creator' | 'customer';

interface Settings {
  storeName: string;
  depositFee: number;
  pickupFee: number;
}

const Index = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [cashierName, setCashierName] = useState('');
  const [password, setPassword] = useState('');
  const [currentCashier, setCurrentCashier] = useState('');
  const [userRole, setUserRole] = useState<UserRole>('cashier');
  
  const [settings, setSettings] = useState<Settings>({
    storeName: 'DocuStore',
    depositFee: 0,
    pickupFee: 0,
  });

  const [editingDoc, setEditingDoc] = useState<Document | null>(null);

  const [documents, setDocuments] = useState<Document[]>([]);
  const [activeTab, setActiveTab] = useState('issue');

  const [newDocNumber, setNewDocNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerLastName, setCustomerLastName] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [pickupAmount, setPickupAmount] = useState('');

  const [scanQrNumber, setScanQrNumber] = useState('');

  const handleLogin = () => {
    if (!cashierName.trim()) {
      toast.error('Введите имя или номер телефона');
      return;
    }
    
    if (password === '202505') {
      setUserRole('creator');
      setCurrentCashier(cashierName);
      setIsLoggedIn(true);
      toast.success(`Создатель ${cashierName} вошёл в систему`);
    } else if (password === '2025') {
      setUserRole('admin');
      setCurrentCashier(cashierName);
      setIsLoggedIn(true);
      toast.success(`Администратор ${cashierName} вошёл в систему`);
    } else if (password === '25') {
      setUserRole('cashier');
      setCurrentCashier(cashierName);
      setIsLoggedIn(true);
      toast.success(`Кассир ${cashierName} вошёл в систему`);
    } else {
      const customerDocs = documents.filter(
        (d) => d.recipientPhone === cashierName || 
        (d.customerName.toLowerCase() + ' ' + d.customerLastName.toLowerCase()).includes(cashierName.toLowerCase())
      );
      
      if (customerDocs.length > 0) {
        setUserRole('customer');
        setCurrentCashier(cashierName);
        setIsLoggedIn(true);
        toast.success(`Добро пожаловать, клиент!`);
      } else {
        toast.error('Неверный пароль или данные не найдены');
      }
    }
  };

  const generateQRCode = async (text: string): Promise<string> => {
    try {
      return await QRCode.toDataURL(text, {
        width: 300,
        margin: 2,
        color: {
          dark: '#8B5CF6',
          light: '#FFFFFF',
        },
      });
    } catch (err) {
      console.error(err);
      return '';
    }
  };

  const handleIssueDocument = async () => {
    if (!customerName.trim()) {
      toast.error('Введите имя клиента');
      return;
    }
    if (!customerLastName.trim()) {
      toast.error('Введите фамилию клиента');
      return;
    }
    if (!itemDescription.trim()) {
      toast.error('Введите описание вещи');
      return;
    }
    if (!pickupDate) {
      toast.error('Укажите когда заберут вещь');
      return;
    }
    if (!recipientPhone.trim()) {
      toast.error('Введите номер телефона получателя');
      return;
    }
    if (!depositAmount || parseFloat(depositAmount) < 0) {
      toast.error('Введите сумму при сдаче');
      return;
    }
    if (!pickupAmount || parseFloat(pickupAmount) < 0) {
      toast.error('Введите сумму при получении');
      return;
    }

    const docNumber = newDocNumber.trim() || `DOC-${Date.now()}`;
    const qrCode = await generateQRCode(docNumber);

    if (editingDoc) {
      const updatedDocs = documents.map((d) =>
        d.id === editingDoc.id
          ? {
              ...d,
              number: docNumber,
              customerName: customerName.trim(),
              customerLastName: customerLastName.trim(),
              itemDescription: itemDescription.trim(),
              pickupDate: pickupDate,
              recipientPhone: recipientPhone.trim(),
              recipientEmail: recipientEmail.trim(),
              depositAmount: parseFloat(depositAmount),
              pickupAmount: parseFloat(pickupAmount),
              qrCode,
            }
          : d
      );
      setDocuments(updatedDocs);
      toast.success(`Документ ${docNumber} обновлён`);
      setEditingDoc(null);
    } else {
      const newDoc: Document = {
        id: `${Date.now()}`,
        number: docNumber,
        customerName: customerName.trim(),
        customerLastName: customerLastName.trim(),
        itemDescription: itemDescription.trim(),
        pickupDate: pickupDate,
        recipientPhone: recipientPhone.trim(),
        recipientEmail: recipientEmail.trim(),
        depositAmount: parseFloat(depositAmount),
        pickupAmount: parseFloat(pickupAmount),
        issuedBy: currentCashier,
        issuedAt: new Date(),
        status: 'issued',
        qrCode,
      };
      setDocuments([newDoc, ...documents]);
      toast.success(`Документ ${docNumber} выдан клиенту ${customerName} ${customerLastName}`);
    }

    setNewDocNumber('');
    setCustomerName('');
    setCustomerLastName('');
    setItemDescription('');
    setPickupDate('');
    setRecipientPhone('');
    setRecipientEmail('');
    setDepositAmount('');
    setPickupAmount('');
  };

  const handleDeleteDocument = (docId: string) => {
    if (userRole !== 'admin' && userRole !== 'creator') {
      toast.error('Недостаточно прав для удаления');
      return;
    }
    setDocuments(documents.filter((d) => d.id !== docId));
    toast.success('Документ удалён');
  };

  const handleEditDocument = (doc: Document) => {
    if (userRole !== 'admin' && userRole !== 'creator') {
      toast.error('Недостаточно прав для редактирования');
      return;
    }
    setEditingDoc(doc);
    setNewDocNumber(doc.number);
    setCustomerName(doc.customerName);
    setCustomerLastName(doc.customerLastName);
    setItemDescription(doc.itemDescription);
    setPickupDate(doc.pickupDate);
    setRecipientPhone(doc.recipientPhone);
    setRecipientEmail(doc.recipientEmail || '');
    setDepositAmount(doc.depositAmount.toString());
    setPickupAmount(doc.pickupAmount.toString());
    setActiveTab('issue');
  };

  const handlePickupDocument = (docNumber: string) => {
    const doc = documents.find((d) => d.number === docNumber && d.status === 'issued');
    
    if (!doc) {
      toast.error('Документ не найден или уже получен');
      return;
    }

    const updatedDocs = documents.map((d) =>
      d.number === docNumber
        ? { ...d, status: 'picked_up' as const, pickedUpAt: new Date() }
        : d
    );

    setDocuments(updatedDocs);

    const utterance = new SpeechSynthesisUtterance(`Номер документа: ${docNumber}`);
    utterance.lang = 'ru-RU';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);

    toast.success(`Документ ${docNumber} выдан клиенту ${doc.customerName}`);
    setScanQrNumber('');
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-primary p-4">
        <Card className="w-full max-w-md shadow-2xl border-0">
          <CardHeader className="space-y-2 pb-6">
            <div className="w-20 h-20 mx-auto gradient-accent rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <Icon name="QrCode" size={40} className="text-white" />
            </div>
            <CardTitle className="text-3xl text-center">Система учёта документов</CardTitle>
            <CardDescription className="text-center text-base">
              Вход для сотрудников и клиентов
            </CardDescription>
            <div className="text-xs text-center text-muted-foreground space-y-1 pt-2">
              <p>Кассир: пароль <strong>25</strong></p>
              <p>Админ: пароль <strong>2025</strong></p>
              <p>Создатель: пароль <strong>202505</strong></p>
              <p>Клиент: имя или номер телефона (без пароля)</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="cashier">Имя или номер телефона</Label>
              <Input
                id="cashier"
                placeholder="Введите ваше имя или телефон"
                value={cashierName}
                onChange={(e) => setCashierName(e.target.value)}
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Пароль (для клиентов — оставьте пустым)</Label>
              <Input
                id="password"
                type="password"
                placeholder="Введите пароль или оставьте пустым"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className="h-12"
              />
            </div>
            <Button onClick={handleLogin} className="w-full h-12 text-base gradient-primary shadow-lg hover:opacity-90">
              <Icon name="LogIn" size={20} className="mr-2" />
              Войти в систему
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (userRole === 'customer') {
    const customerDocs = documents.filter(
      (d) =>
        d.recipientPhone === currentCashier ||
        (d.customerName.toLowerCase() + ' ' + d.customerLastName.toLowerCase()).includes(
          currentCashier.toLowerCase()
        )
    );

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <div className="border-b bg-white/80 backdrop-blur-lg shadow-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center shadow-md">
                <Icon name="ShoppingBag" size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Мои вещи
                </h1>
                <p className="text-sm text-muted-foreground">🛍️ Клиент: {currentCashier}</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setIsLoggedIn(false);
                setCashierName('');
                setPassword('');
                toast.success('Вы вышли из системы');
              }}
              className="gap-2"
            >
              <Icon name="LogOut" size={18} />
              Выйти
            </Button>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Icon name="Package" size={28} className="text-primary" />
                Ваши вещи на хранении
              </CardTitle>
              <CardDescription>Всего предметов: {customerDocs.length}</CardDescription>
            </CardHeader>
            <CardContent>
              {customerDocs.length === 0 ? (
                <div className="text-center py-12">
                  <Icon name="PackageOpen" size={64} className="mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-lg text-muted-foreground">У вас нет вещей на хранении</p>
                </div>
              ) : (
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-4">
                    {customerDocs.map((doc) => (
                      <Card key={doc.id} className="p-5 border-2 hover:shadow-lg transition-shadow">
                        <div className="flex gap-4">
                          <img src={doc.qrCode} alt="QR Code" className="w-32 h-32 rounded-lg shadow-md" />
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-bold text-2xl text-primary">{doc.number}</p>
                                <p className="text-lg font-medium text-foreground">{doc.itemDescription}</p>
                              </div>
                              {doc.status === 'issued' ? (
                                <Badge className="gradient-primary text-white text-base px-3 py-1">На хранении</Badge>
                              ) : (
                                <Badge variant="outline" className="border-green-500 text-green-700 text-base px-3 py-1">
                                  Получено
                                </Badge>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div className="flex items-center gap-2">
                                <Icon name="Calendar" size={18} className="text-purple-600" />
                                <span>Дата забора: {new Date(doc.pickupDate).toLocaleDateString('ru-RU')}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Icon name="DollarSign" size={18} className="text-blue-600" />
                                <span>К оплате при получении: {doc.pickupAmount}₽</span>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Сдано: {doc.issuedAt.toLocaleString('ru-RU')}
                            </p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="border-b bg-white/80 backdrop-blur-lg shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center shadow-md">
              <Icon name="QrCode" size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {settings.storeName}
              </h1>
              <p className="text-sm text-muted-foreground">
                {userRole === 'creator' && '👑 Создатель'}
                {userRole === 'admin' && '🛡️ Администратор'}
                {userRole === 'cashier' && '👤 Кассир'}
                : {currentCashier}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setIsLoggedIn(false);
              setCashierName('');
              setPassword('');
              setUserRole('cashier');
              toast.success('Вы вышли из системы');
            }}
            className="gap-2"
          >
            <Icon name="LogOut" size={18} />
            Выйти
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={`grid w-full h-14 bg-white shadow-md ${userRole === 'cashier' ? 'grid-cols-2' : (userRole === 'creator' ? 'grid-cols-4' : 'grid-cols-3')}`}>
            {(userRole === 'admin' || userRole === 'creator' || userRole === 'cashier') && (
              <TabsTrigger value="issue" className="gap-2 text-base data-[state=active]:gradient-primary data-[state=active]:text-white">
                <Icon name="FilePlus" size={20} />
                Выдача
              </TabsTrigger>
            )}
            {(userRole === 'admin' || userRole === 'creator' || userRole === 'cashier') && (
              <TabsTrigger value="pickup" className="gap-2 text-base data-[state=active]:gradient-primary data-[state=active]:text-white">
                <Icon name="ScanLine" size={20} />
                Получение
              </TabsTrigger>
            )}
            {(userRole === 'admin' || userRole === 'creator') && (
              <TabsTrigger value="archive" className="gap-2 text-base data-[state=active]:gradient-primary data-[state=active]:text-white">
                <Icon name="Archive" size={20} />
                Архив
              </TabsTrigger>
            )}
            {userRole === 'creator' && (
              <TabsTrigger value="settings" className="gap-2 text-base data-[state=active]:gradient-primary data-[state=active]:text-white">
                <Icon name="Settings" size={20} />
                Управление
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="issue" className="space-y-6">
            <Card className="shadow-lg border-0">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Icon name="FilePlus" size={28} className="text-primary" />
                  Выдать документ
                </CardTitle>
                <CardDescription>Создайте новый документ и сгенерируйте QR-код</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="docNumber">Номер документа (опционально)</Label>
                  <Input
                    id="docNumber"
                    placeholder="Оставьте пустым для автогенерации"
                    value={newDocNumber}
                    onChange={(e) => setNewDocNumber(e.target.value)}
                    className="h-12"
                  />
                </div>
                
                <div className="p-5 bg-purple-50 rounded-lg space-y-4 border-2 border-purple-200">
                  <h3 className="font-semibold text-lg flex items-center gap-2 text-primary">
                    <Icon name="FileText" size={20} />
                    Анкета клиента
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="customer">Имя *</Label>
                      <Input
                        id="customer"
                        placeholder="Введите имя"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customerLastName">Фамилия *</Label>
                      <Input
                        id="customerLastName"
                        placeholder="Введите фамилию"
                        value={customerLastName}
                        onChange={(e) => setCustomerLastName(e.target.value)}
                        className="h-12"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="itemDescription">Что за вещь *</Label>
                    <Input
                      id="itemDescription"
                      placeholder="Например: Синяя куртка, Паспорт, Сумка"
                      value={itemDescription}
                      onChange={(e) => setItemDescription(e.target.value)}
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pickupDate">Когда заберут *</Label>
                    <Input
                      id="pickupDate"
                      type="date"
                      value={pickupDate}
                      onChange={(e) => setPickupDate(e.target.value)}
                      className="h-12"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="recipientPhone">Телефон получателя *</Label>
                      <Input
                        id="recipientPhone"
                        type="tel"
                        placeholder="+7 (___) ___-__-__"
                        value={recipientPhone}
                        onChange={(e) => setRecipientPhone(e.target.value)}
                        className="h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="recipientEmail">Email получателя</Label>
                      <Input
                        id="recipientEmail"
                        type="email"
                        placeholder="email@example.com"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        className="h-12"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="depositAmount">Сумма при сдаче (₽) *</Label>
                    <Input
                      id="depositAmount"
                      type="number"
                      placeholder="0"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pickupAmount">Сумма при получении (₽) *</Label>
                    <Input
                      id="pickupAmount"
                      type="number"
                      placeholder="0"
                      value={pickupAmount}
                      onChange={(e) => setPickupAmount(e.target.value)}
                      className="h-12"
                    />
                  </div>
                </div>
                {editingDoc && (
                  <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
                    <Icon name="Info" size={20} className="text-blue-600" />
                    <p className="text-sm text-blue-700 flex-1">
                      Режим редактирования документа <strong>{editingDoc.number}</strong>
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingDoc(null);
                        setNewDocNumber('');
                        setCustomerName('');
                        setCustomerLastName('');
                        setItemDescription('');
                        setPickupDate('');
                        setRecipientPhone('');
                        setRecipientEmail('');
                        setDepositAmount('');
                        setPickupAmount('');
                      }}
                    >
                      <Icon name="X" size={16} />
                    </Button>
                  </div>
                )}
                <Button onClick={handleIssueDocument} className="w-full h-14 text-lg gradient-primary shadow-lg hover:opacity-90">
                  <Icon name="QrCode" size={24} className="mr-2" />
                  {editingDoc ? 'Сохранить изменения' : 'Выдать документ и создать QR-код'}
                </Button>
              </CardContent>
            </Card>

            {documents.filter((d) => d.status === 'issued').length > 0 && (
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="Clock" size={24} className="text-accent" />
                    Активные документы
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-4">
                      {documents
                        .filter((d) => d.status === 'issued')
                        .map((doc) => (
                          <Card key={doc.id} className="p-4 border-2 hover:shadow-md transition-shadow">
                            <div className="flex gap-4">
                              <img src={doc.qrCode} alt="QR Code" className="w-32 h-32 rounded-lg shadow-sm" />
                              <div className="flex-1 space-y-2">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <p className="font-bold text-xl text-primary">{doc.number}</p>
                                    <p className="text-sm text-muted-foreground">
                                      Клиент: {doc.customerName} {doc.customerLastName}
                                    </p>
                                    <p className="text-sm font-medium text-foreground">Вещь: {doc.itemDescription}</p>
                                  </div>
                                  <Badge className="gradient-primary text-white">Активен</Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div className="flex items-center gap-1">
                                    <Icon name="Calendar" size={16} className="text-purple-600" />
                                    <span>Дата забора: {new Date(doc.pickupDate).toLocaleDateString('ru-RU')}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Icon name="Phone" size={16} className="text-blue-600" />
                                    <span>{doc.recipientPhone}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Icon name="DollarSign" size={16} className="text-green-600" />
                                    <span>При сдаче: {doc.depositAmount}₽</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Icon name="DollarSign" size={16} className="text-blue-600" />
                                    <span>При получении: {doc.pickupAmount}₽</span>
                                  </div>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Выдал: {doc.issuedBy} • {doc.issuedAt.toLocaleString('ru-RU')}
                                </p>
                                {(userRole === 'admin' || userRole === 'creator') && (
                                  <div className="flex gap-2 pt-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleEditDocument(doc)}
                                      className="gap-1"
                                    >
                                      <Icon name="Edit" size={14} />
                                      Редактировать
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => handleDeleteDocument(doc.id)}
                                      className="gap-1"
                                    >
                                      <Icon name="Trash2" size={14} />
                                      Удалить
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </Card>
                        ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="pickup" className="space-y-6">
            <Card className="shadow-lg border-0">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Icon name="ScanLine" size={28} className="text-accent" />
                  Получить документ
                </CardTitle>
                <CardDescription>Отсканируйте QR-код или введите номер документа</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="scanQr">Номер документа</Label>
                  <Input
                    id="scanQr"
                    placeholder="Введите номер документа из QR-кода"
                    value={scanQrNumber}
                    onChange={(e) => setScanQrNumber(e.target.value)}
                    className="h-14 text-lg"
                  />
                </div>
                <Button
                  onClick={() => handlePickupDocument(scanQrNumber)}
                  className="w-full h-14 text-lg gradient-accent shadow-lg hover:opacity-90"
                  disabled={!scanQrNumber.trim()}
                >
                  <Icon name="CheckCircle" size={24} className="mr-2" />
                  Выдать документ клиенту
                </Button>
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
                  <Icon name="Volume2" size={20} className="text-primary" />
                  <p>При получении система озвучит номер документа</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="archive" className="space-y-6">
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Icon name="Archive" size={28} className="text-primary" />
                  Архив операций
                </CardTitle>
                <CardDescription>История всех выданных и полученных документов</CardDescription>
              </CardHeader>
              <CardContent>
                {documents.length === 0 ? (
                  <div className="text-center py-12">
                    <Icon name="FileX" size={64} className="mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-lg text-muted-foreground">Пока нет документов в архиве</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[600px] pr-4">
                    <div className="space-y-4">
                      {documents.map((doc) => (
                        <Card key={doc.id} className="p-5 border-2 hover:shadow-md transition-shadow">
                          <div className="flex gap-4">
                            <img src={doc.qrCode} alt="QR Code" className="w-28 h-28 rounded-lg shadow-sm" />
                            <div className="flex-1 space-y-2">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-bold text-xl text-primary">{doc.number}</p>
                                  <p className="text-sm text-muted-foreground">
                                    Клиент: {doc.customerName} {doc.customerLastName}
                                  </p>
                                  <p className="text-sm font-medium text-foreground">Вещь: {doc.itemDescription}</p>
                                </div>
                                {doc.status === 'issued' ? (
                                  <Badge className="gradient-primary text-white">Активен</Badge>
                                ) : (
                                  <Badge variant="outline" className="border-green-500 text-green-700">
                                    Получен
                                  </Badge>
                                )}
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="flex items-center gap-1">
                                  <Icon name="Calendar" size={16} className="text-purple-600" />
                                  <span>Дата забора: {new Date(doc.pickupDate).toLocaleDateString('ru-RU')}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Icon name="Phone" size={16} className="text-blue-600" />
                                  <span>{doc.recipientPhone}</span>
                                </div>
                                {doc.recipientEmail && (
                                  <div className="flex items-center gap-1 col-span-2">
                                    <Icon name="Mail" size={16} className="text-purple-600" />
                                    <span>{doc.recipientEmail}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-1">
                                  <Icon name="DollarSign" size={16} className="text-green-600" />
                                  <span>При сдаче: {doc.depositAmount}₽</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Icon name="DollarSign" size={16} className="text-blue-600" />
                                  <span>При получении: {doc.pickupAmount}₽</span>
                                </div>
                              </div>
                              <div className="space-y-1 text-xs text-muted-foreground">
                                <p>Выдан: {doc.issuedBy} • {doc.issuedAt.toLocaleString('ru-RU')}</p>
                                {doc.pickedUpAt && (
                                  <p className="text-green-700">
                                    Получен: {doc.pickedUpAt.toLocaleString('ru-RU')}
                                  </p>
                                )}
                              </div>
                              {(userRole === 'admin' || userRole === 'creator') && (
                                <div className="flex gap-2 pt-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEditDocument(doc)}
                                    className="gap-1"
                                  >
                                    <Icon name="Edit" size={14} />
                                    Редактировать
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDeleteDocument(doc.id)}
                                    className="gap-1"
                                  >
                                    <Icon name="Trash2" size={14} />
                                    Удалить
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {userRole === 'creator' && (
            <TabsContent value="settings" className="space-y-6">
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Icon name="Crown" size={28} className="text-primary" />
                    Управление системой
                  </CardTitle>
                  <CardDescription>Настройки доступны только создателю</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-5 bg-purple-50 rounded-lg space-y-4 border-2 border-purple-200">
                    <h3 className="font-semibold text-lg flex items-center gap-2 text-primary">
                      <Icon name="Store" size={20} />
                      Настройки магазина
                    </h3>
                    <div className="space-y-2">
                      <Label htmlFor="storeName">Название системы</Label>
                      <Input
                        id="storeName"
                        value={settings.storeName}
                        onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                        className="h-12"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="depositFee">Комиссия при сдаче (₽)</Label>
                        <Input
                          id="depositFee"
                          type="number"
                          value={settings.depositFee}
                          onChange={(e) => setSettings({ ...settings, depositFee: parseFloat(e.target.value) })}
                          className="h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pickupFee">Комиссия при получении (₽)</Label>
                        <Input
                          id="pickupFee"
                          type="number"
                          value={settings.pickupFee}
                          onChange={(e) => setSettings({ ...settings, pickupFee: parseFloat(e.target.value) })}
                          className="h-12"
                        />
                      </div>
                    </div>
                    <Button className="gradient-primary">
                      <Icon name="Save" size={20} className="mr-2" />
                      Сохранить настройки
                    </Button>
                  </div>

                  <div className="p-5 bg-blue-50 rounded-lg space-y-4 border-2 border-blue-200">
                    <h3 className="font-semibold text-lg flex items-center gap-2 text-blue-700">
                      <Icon name="Shield" size={20} />
                      Уровни доступа
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="p-3 bg-white rounded border">
                        <p className="font-semibold text-purple-600">👑 Создатель (пароль: 202505)</p>
                        <p className="text-muted-foreground">Полный доступ ко всем функциям и настройкам</p>
                      </div>
                      <div className="p-3 bg-white rounded border">
                        <p className="font-semibold text-blue-600">🛡️ Администратор (пароль: 2025)</p>
                        <p className="text-muted-foreground">Выдача, получение, архив, редактирование, удаление</p>
                      </div>
                      <div className="p-3 bg-white rounded border">
                        <p className="font-semibold text-green-600">👤 Кассир (пароль: 25)</p>
                        <p className="text-muted-foreground">Только выдача и получение документов</p>
                      </div>
                      <div className="p-3 bg-white rounded border">
                        <p className="font-semibold text-orange-600">🛍️ Клиент (без пароля)</p>
                        <p className="text-muted-foreground">Просмотр своих вещей и QR-кодов</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 bg-green-50 rounded-lg space-y-4 border-2 border-green-200">
                    <h3 className="font-semibold text-lg flex items-center gap-2 text-green-700">
                      <Icon name="BarChart3" size={20} />
                      Статистика
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 bg-white rounded-lg text-center">
                        <p className="text-3xl font-bold text-purple-600">{documents.filter((d) => d.status === 'issued').length}</p>
                        <p className="text-sm text-muted-foreground">Активных</p>
                      </div>
                      <div className="p-4 bg-white rounded-lg text-center">
                        <p className="text-3xl font-bold text-green-600">{documents.filter((d) => d.status === 'picked_up').length}</p>
                        <p className="text-sm text-muted-foreground">Получено</p>
                      </div>
                      <div className="p-4 bg-white rounded-lg text-center">
                        <p className="text-3xl font-bold text-blue-600">{documents.length}</p>
                        <p className="text-sm text-muted-foreground">Всего</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default Index;