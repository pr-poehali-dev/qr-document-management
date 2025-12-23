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
  depositAmount: number;
  pickupAmount: number;
  issuedBy: string;
  issuedAt: Date;
  pickedUpAt?: Date;
  status: 'issued' | 'picked_up';
  qrCode: string;
}

const Index = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [cashierName, setCashierName] = useState('');
  const [password, setPassword] = useState('');
  const [currentCashier, setCurrentCashier] = useState('');

  const [documents, setDocuments] = useState<Document[]>([]);
  const [activeTab, setActiveTab] = useState('issue');

  const [newDocNumber, setNewDocNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [pickupAmount, setPickupAmount] = useState('');

  const [scanQrNumber, setScanQrNumber] = useState('');

  const handleLogin = () => {
    if (!cashierName.trim()) {
      toast.error('Введите имя кассира');
      return;
    }
    if (password !== '2025') {
      toast.error('Неверный пароль');
      return;
    }
    setCurrentCashier(cashierName);
    setIsLoggedIn(true);
    toast.success(`Добро пожаловать, ${cashierName}!`);
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

    const newDoc: Document = {
      id: `${Date.now()}`,
      number: docNumber,
      customerName: customerName.trim(),
      depositAmount: parseFloat(depositAmount),
      pickupAmount: parseFloat(pickupAmount),
      issuedBy: currentCashier,
      issuedAt: new Date(),
      status: 'issued',
      qrCode,
    };

    setDocuments([newDoc, ...documents]);
    toast.success(`Документ ${docNumber} выдан клиенту ${customerName}`);

    setNewDocNumber('');
    setCustomerName('');
    setDepositAmount('');
    setPickupAmount('');
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
              Вход для кассиров и администраторов
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="cashier">Имя кассира</Label>
              <Input
                id="cashier"
                placeholder="Введите ваше имя"
                value={cashierName}
                onChange={(e) => setCashierName(e.target.value)}
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                placeholder="Введите пароль"
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
                DocuStore
              </h1>
              <p className="text-sm text-muted-foreground">Кассир: {currentCashier}</p>
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-14 bg-white shadow-md">
            <TabsTrigger value="issue" className="gap-2 text-base data-[state=active]:gradient-primary data-[state=active]:text-white">
              <Icon name="FilePlus" size={20} />
              Выдача
            </TabsTrigger>
            <TabsTrigger value="pickup" className="gap-2 text-base data-[state=active]:gradient-primary data-[state=active]:text-white">
              <Icon name="ScanLine" size={20} />
              Получение
            </TabsTrigger>
            <TabsTrigger value="archive" className="gap-2 text-base data-[state=active]:gradient-primary data-[state=active]:text-white">
              <Icon name="Archive" size={20} />
              Архив
            </TabsTrigger>
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
                <div className="space-y-2">
                  <Label htmlFor="customer">Имя клиента</Label>
                  <Input
                    id="customer"
                    placeholder="Введите имя клиента"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="h-12"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="depositAmount">Сумма при сдаче (₽)</Label>
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
                    <Label htmlFor="pickupAmount">Сумма при получении (₽)</Label>
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
                <Button onClick={handleIssueDocument} className="w-full h-14 text-lg gradient-primary shadow-lg hover:opacity-90">
                  <Icon name="QrCode" size={24} className="mr-2" />
                  Выдать документ и создать QR-код
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
                                    <p className="text-sm text-muted-foreground">Клиент: {doc.customerName}</p>
                                  </div>
                                  <Badge className="gradient-primary text-white">Активен</Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
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
                                  <p className="text-sm text-muted-foreground">Клиент: {doc.customerName}</p>
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
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
