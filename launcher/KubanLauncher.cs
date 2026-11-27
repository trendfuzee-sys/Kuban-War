using System;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.Windows.Forms;
using System.Web.Script.Serialization;
using System.Security.Cryptography;

class Entry { public string path {get;set;} public string asset {get;set;} public string sha256 {get;set;} public long size {get;set;} }
class Manifest { public string version {get;set;} public string exe {get;set;} public List<Entry> files {get;set;} }
class Asset { public string name {get;set;} public string browser_download_url {get;set;} }
class Release { public string tag_name {get;set;} public string name {get;set;} public string body {get;set;} public string published_at {get;set;} public List<Asset> assets {get;set;} }
class News { public string title {get;set;} public string date {get;set;} public string body {get;set;} }
class Launcher : Form {
 const string Api="https://api.github.com/repos/trendfuzee-sys/Kuban-War";
 const string Raw="https://raw.githubusercontent.com/trendfuzee-sys/Kuban-War/main/news.json";
 static readonly string Data=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),"KubanLauncher");
 readonly HttpClient http=new HttpClient(); readonly JavaScriptSerializer json=new JavaScriptSerializer(){MaxJsonLength=16000000};
 readonly Label status=new Label(), folder=new Label(), version=new Label();
 readonly Button play=new Button(), check=new Button(), choose=new Button(), pause=new Button(); readonly CheckBox auto=new CheckBox(){Text="Автоматически скачивать обновления",Width=500,Checked=true};
 readonly ProgressBar progress=new ProgressBar(); readonly RichTextBox news=new RichTextBox(), changes=new RichTextBox();
 string root, exeName="Война за Кубань.exe"; Manifest manifest; Release release; List<Entry> pending=new List<Entry>();
 CancellationTokenSource cancel; bool busy, online; Process game;
 [STAThread] static void Main(){Application.EnableVisualStyles();Application.SetCompatibleTextRenderingDefault(false);Application.Run(new Launcher());}
 Launcher(){
  ServicePointManager.SecurityProtocol=SecurityProtocolType.Tls12; http.DefaultRequestHeaders.UserAgent.ParseAdd("KubanLauncher/1.0"); http.Timeout=TimeSpan.FromMinutes(10);
  Directory.CreateDirectory(Data); root=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),"KubanWarGame");
  string cfg=Path.Combine(Data,"folder.txt"); if(File.Exists(cfg))root=File.ReadAllText(cfg);
  if(File.Exists(Path.Combine(AppDomain.CurrentDomain.BaseDirectory,exeName)) && !File.Exists(cfg))root=AppDomain.CurrentDomain.BaseDirectory;
  Text="Война за Кубань • Launcher"; Width=850; Height=600; MinimumSize=new Size(720,500); BackColor=Color.FromArgb(25,29,30); ForeColor=Color.Wheat; Font=new Font("Segoe UI",11);
  var title=new Label(){Text="ВОЙНА ЗА КУБАНЬ",Dock=DockStyle.Top,Height=78,Font=new Font("Georgia",26,FontStyle.Bold),TextAlign=ContentAlignment.MiddleCenter};
  var tabs=new TabControl(){Dock=DockStyle.Fill}; var home=new TabPage("Главная"){BackColor=BackColor,ForeColor=ForeColor}; var n=new TabPage("Новости");var u=new TabPage("Обновления");var s=new TabPage("Настройки"){BackColor=BackColor,ForeColor=ForeColor};
  tabs.TabPages.AddRange(new[]{home,n,u,s}); Controls.Add(tabs);Controls.Add(title);
  var stack=new FlowLayoutPanel(){Dock=DockStyle.Fill,FlowDirection=FlowDirection.TopDown,WrapContents=false,Padding=new Padding(24),AutoScroll=true};
  home.Controls.Add(stack); foreach(var l in new[]{version,status}){l.Width=650;l.Height=55;stack.Controls.Add(l);} progress.Width=620;progress.Height=22;stack.Controls.Add(progress);
  Setup(play,"Скачать игру",stack); Setup(check,"Проверить файлы",stack);Setup(pause,"Приостановить",stack);
  var settings=new FlowLayoutPanel(){Dock=DockStyle.Fill,FlowDirection=FlowDirection.TopDown,Padding=new Padding(20)};s.Controls.Add(settings);folder.Width=650;folder.Height=65;settings.Controls.Add(folder);Setup(choose,"Выбрать папку игры",settings);settings.Controls.Add(auto); string pref=Path.Combine(Data,"auto.txt");auto.Checked=!File.Exists(pref)||File.ReadAllText(pref)!="0";auto.CheckedChanged+=(a,b)=>File.WriteAllText(pref,auto.Checked?"1":"0");
  foreach(var box in new[]{news,changes}){box.Dock=DockStyle.Fill;box.ReadOnly=true;box.BackColor=Color.FromArgb(34,39,40);box.ForeColor=Color.Wheat;box.BorderStyle=BorderStyle.None;}
  n.Controls.Add(news);u.Controls.Add(changes);
  choose.Click+=async (a,b)=>{using(var d=new FolderBrowserDialog()){d.Description="Выберите папку с EXE или пустую папку для установки";if(d.ShowDialog()!=DialogResult.OK)return;root=d.SelectedPath;File.WriteAllText(cfg,root);await RefreshGame();}};
  check.Click+=async(a,b)=>await RefreshGame();pause.Click+=(a,b)=>{if(cancel!=null)cancel.Cancel();};play.Click+=async(a,b)=>{if(online && pending.Count>0)await Install();else if(File.Exists(GameExe())){try{game=Process.Start(new ProcessStartInfo(GameExe()){WorkingDirectory=root});}catch(Exception e){status.Text=e.Message;}}else await RefreshGame();};
  Shown+=async(a,b)=>{await RefreshGame();if(auto.Checked && online && pending.Count>0 && File.Exists(GameExe()) && !Running())await Install();};FormClosing+=(a,b)=>{if(busy){b.Cancel=true;status.Text="Сначала завершите или приостановите операцию.";if(cancel!=null)cancel.Cancel();}};
  news.Text="Новости пока не загружены."; changes.Text="Обновления пока не загружены.";UpdateUI();
 }
 void Setup(Button b,string t,Control p){b.Text=t;b.Width=300;b.Height=43;b.FlatStyle=FlatStyle.Flat;b.BackColor=Color.FromArgb(91,70,43);b.ForeColor=Color.Wheat;p.Controls.Add(b);}
 string GameExe(){return Path.Combine(root,exeName);}
 void UpdateUI(){folder.Text=root;choose.Enabled=check.Enabled=!busy;pause.Enabled=busy && cancel!=null;play.Enabled=!busy;play.Text=online&&pending.Count>0?(File.Exists(GameExe())?"Обновить / восстановить":"Скачать игру"):"Играть";if(!online&&!File.Exists(GameExe()))play.Text="Повторить проверку";}
 static string Safe(string basePath,string relative){
  if(String.IsNullOrWhiteSpace(relative)||relative.Contains(":")||relative.Contains("\\")||relative.StartsWith("/")||relative.Split('/').Any(p=>p==""||p=="."||p==".."||p.EndsWith(".")||p.EndsWith(" ")))throw new Exception("Недопустимый путь");
  string b=Path.GetFullPath(basePath).TrimEnd(Path.DirectorySeparatorChar)+Path.DirectorySeparatorChar;string pth=Path.GetFullPath(Path.Combine(b,relative.Replace('/',Path.DirectorySeparatorChar)));
  if(!pth.StartsWith(b,StringComparison.OrdinalIgnoreCase))throw new Exception("Путь вне игры");
  for(string p=pth; p!=null && p.Length>=b.Length-1; p=Path.GetDirectoryName(p)){if((File.Exists(p)||Directory.Exists(p))&&(File.GetAttributes(p)&FileAttributes.ReparsePoint)!=0)throw new Exception("Символьная ссылка запрещена");if(p.Length==b.Length-1)break;}
  return pth;
 }
 static string Hash(string path){using(var f=File.OpenRead(path))using(var h=SHA256.Create())return BitConverter.ToString(h.ComputeHash(f)).Replace("-","").ToLowerInvariant();}
 static bool Valid(string p,Entry e){return File.Exists(p)&&new FileInfo(p).Length==e.size&&Hash(p)==e.sha256;}
 string AssetUrl(string name){var a=release.assets.Single(x=>x.name==name);var uri=new Uri(a.browser_download_url);if(uri.Scheme!="https"||uri.Host!="github.com"||!uri.AbsolutePath.StartsWith("/trendfuzee-sys/Kuban-War/releases/download/",StringComparison.Ordinal))throw new Exception("Недоверенный адрес");return a.browser_download_url;}
 async Task RefreshGame(){
  busy=true;online=false;pending.Clear();UpdateUI();status.Text="Проверка обновлений…";progress.Value=0;
  try {
   try{var feed=json.Deserialize<List<News>>(await http.GetStringAsync(Raw));news.Text=String.Join("\n\n",feed.Select(x=>x.date+"  "+x.title+"\n"+x.body));File.WriteAllText(Path.Combine(Data,"news.txt"),news.Text);}catch{if(File.Exists(Path.Combine(Data,"news.txt")))news.Text=File.ReadAllText(Path.Combine(Data,"news.txt"));}
   release=json.Deserialize<Release>(await http.GetStringAsync(Api+"/releases/latest"));
   changes.Text=release.name+" • "+release.published_at+"\n\n"+release.body;
   manifest=json.Deserialize<Manifest>(await http.GetStringAsync(AssetUrl("manifest.json")));
   if(manifest.files==null||manifest.files.Count==0||manifest.files.Count>10000||!System.Text.RegularExpressions.Regex.IsMatch(manifest.version??"",@"^[0-9]+\.[0-9]+\.[0-9]+$"))throw new Exception("Некорректный манифест");
   if(manifest.exe!=exeName||!manifest.files.Any(x=>x.path==exeName))throw new Exception("EXE отсутствует в манифесте");
   var seen=new HashSet<string>(StringComparer.OrdinalIgnoreCase);
   foreach(var e in manifest.files){Safe(root,e.path);if(!seen.Add(e.path)||e.size<0||!System.Text.RegularExpressions.Regex.IsMatch(e.sha256??"","^[a-f0-9]{64}$"))throw new Exception("Некорректная запись манифеста");AssetUrl(e.asset);}
   pending=await Task.Run(()=>manifest.files.Where(e=>!Valid(Safe(root,e.path),e)).ToList());
   online=true;version.Text=(pending.Count==0?"Установленная версия: ":"Доступная версия: ")+manifest.version;status.Text=pending.Count==0?"Игра актуальна.":String.Format("К загрузке: {0} файлов • {1:F1} МБ",pending.Count,pending.Sum(e=>e.size)/1048576.0);
  }catch(Exception e){status.Text="Обновления недоступны: "+e.Message;version.Text=File.Exists(GameExe())?"Офлайн • установленная игра":"Нет опубликованной сборки";}
  finally{busy=false;UpdateUI();}
 }
 bool Running(){if(game!=null&&!game.HasExited)return true;return Process.GetProcessesByName(Path.GetFileNameWithoutExtension(exeName)).Length>0;}
 async Task Install(){
  if(Running()){status.Text="Закройте игру перед обновлением.";return;}
  busy=true;cancel=new CancellationTokenSource();UpdateUI();var ct=cancel.Token;
  string stage=Path.Combine(Data,"stage",manifest.version), backup=Path.Combine(Data,"backup",Guid.NewGuid().ToString("N"));bool success=false;
  try{
   Directory.CreateDirectory(root);Directory.CreateDirectory(stage);long total=pending.Sum(e=>e.size),done=0;var watch=Stopwatch.StartNew();
   foreach(var e in pending){ct.ThrowIfCancellationRequested();string p=Safe(stage,e.path);Directory.CreateDirectory(Path.GetDirectoryName(p));
    if(!Valid(p,e)){string tmp=p+".part";using(var response=await http.GetAsync(AssetUrl(e.asset),HttpCompletionOption.ResponseHeadersRead,ct)){response.EnsureSuccessStatusCode();using(var input=await response.Content.ReadAsStreamAsync())using(var output=new FileStream(tmp,FileMode.Create,FileAccess.Write,FileShare.None,65536,true)){byte[] buffer=new byte[65536];int count;long current=0;while((count=await input.ReadAsync(buffer,0,buffer.Length,ct))>0){await output.WriteAsync(buffer,0,count,ct);current+=count;if(current>e.size)throw new Exception("Размер превышен");progress.Value=(int)Math.Min(100,(done+current)*100.0/Math.Max(1,total));status.Text=String.Format("{0:F1} / {1:F1} МБ • {2:F1} МБ/с", (done+current)/1048576.0,total/1048576.0,(done+current)/1048576.0/Math.Max(1,watch.Elapsed.TotalSeconds));}}}if(!Valid(tmp,e))throw new Exception("Ошибка контрольной суммы: "+e.path);if(File.Exists(p))File.Delete(p);File.Move(tmp,p);}
    done+=e.size;
   }
   ct.ThrowIfCancellationRequested();if(Running())throw new Exception("Игра запущена");pause.Enabled=false;
   await Task.Run(()=>{var applied=new List<Entry>();try{foreach(var e in pending){string dest=Safe(root,e.path),old=Safe(backup,e.path);Directory.CreateDirectory(Path.GetDirectoryName(dest));if(File.Exists(dest)){Directory.CreateDirectory(Path.GetDirectoryName(old));File.Copy(dest,old,true);}applied.Add(e);File.Copy(Safe(stage,e.path),dest,true);if(!Valid(dest,e))throw new Exception("Ошибка установки");}}catch{foreach(var e in applied.AsEnumerable().Reverse()){string dest=Safe(root,e.path),old=Safe(backup,e.path);if(File.Exists(old))File.Copy(old,dest,true);else if(File.Exists(dest))File.Delete(dest);}throw;}});
   success=true;progress.Value=100;status.Text="Установка завершена.";pending.Clear();
  }catch(OperationCanceledException){status.Text="Приостановлено. Готовые файлы сохранены; нажмите обновить для продолжения.";}catch(Exception e){status.Text="Ошибка: "+e.Message;}
  finally{cancel.Dispose();cancel=null;busy=false;UpdateUI();}
  if(success)await RefreshGame();
 }
}
