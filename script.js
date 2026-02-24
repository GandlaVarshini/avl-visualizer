class AVLNode {
    constructor(value) {
        this.value = value;
        this.left = null;
        this.right = null;
        this.height = 1;
        this.x = 0;
        this.y = 0;
    }
}

class AVLTree {
    constructor() {
        this.root = null;
        this.onRotation = null;
    }

    getHeight(n){ return n ? n.height : 0; }
    getBalance(n){ return n ? this.getHeight(n.left) - this.getHeight(n.right) : 0; }

    updateHeight(n){
        n.height = 1 + Math.max(this.getHeight(n.left), this.getHeight(n.right));
    }

    rightRotate(y){
        if(this.onRotation) this.onRotation("Right (LL)");

        let x = y.left;
        let T2 = x.right;

        x.right = y;
        y.left = T2;

        this.updateHeight(y);
        this.updateHeight(x);

        return x;
    }

    leftRotate(x){
        if(this.onRotation) this.onRotation("Left (RR)");

        let y = x.right;
        let T2 = y.left;

        y.left = x;
        x.right = T2;

        this.updateHeight(x);
        this.updateHeight(y);

        return y;
    }

    insert(node, val){
        if(!node) return new AVLNode(val);

        if(val < node.value)
            node.left = this.insert(node.left, val);
        else if(val > node.value)
            node.right = this.insert(node.right, val);
        else
            return node;

        this.updateHeight(node);

        let balance = this.getBalance(node);

        if(balance > 1 && val < node.left.value)
            return this.rightRotate(node);

        if(balance < -1 && val > node.right.value)
            return this.leftRotate(node);

        if(balance > 1 && val > node.left.value){
            node.left = this.leftRotate(node.left);
            return this.rightRotate(node);
        }

        if(balance < -1 && val < node.right.value){
            node.right = this.rightRotate(node.right);
            return this.leftRotate(node);
        }

        return node;
    }

    delete(root, value){
        if(!root) return root;

        if(value < root.value)
            root.left = this.delete(root.left, value);
        else if(value > root.value)
            root.right = this.delete(root.right, value);
        else {
            if(!root.left || !root.right){
                let temp = root.left ? root.left : root.right;
                if(!temp) return null;
                else root = temp;
            } else {
                let temp = this.getMin(root.right);
                root.value = temp.value;
                root.right = this.delete(root.right, temp.value);
            }
        }

        this.updateHeight(root);
        let balance = this.getBalance(root);

        if(balance > 1 && this.getBalance(root.left) >= 0)
            return this.rightRotate(root);

        if(balance > 1 && this.getBalance(root.left) < 0){
            root.left = this.leftRotate(root.left);
            return this.rightRotate(root);
        }

        if(balance < -1 && this.getBalance(root.right) <= 0)
            return this.leftRotate(root);

        if(balance < -1 && this.getBalance(root.right) > 0){
            root.right = this.rightRotate(root.right);
            return this.leftRotate(root);
        }

        return root;
    }

    getMin(node){
        while(node.left) node = node.left;
        return node;
    }

    inorder(node, arr=[]){
        if(node){
            this.inorder(node.left, arr);
            arr.push(node.value);
            this.inorder(node.right, arr);
        }
        return arr;
    }
}

class App {
    constructor(){
        this.tree = new AVLTree();
        this.svg = document.getElementById("treeSvg");
        this.history = [];
        this.bindEvents();
        this.render();
    }

    bindEvents(){
        document.getElementById("insertBtn").onclick = () => this.action("insert");
        document.getElementById("deleteBtn").onclick = () => this.action("delete");
        document.getElementById("searchBtn").onclick = () => this.action("search");

        document.getElementById("saveBtn").onclick = () => this.save();
        document.getElementById("loadBtn").onclick = () => this.load();
        document.getElementById("exportBtn").onclick = () => this.exportPNG();

        document.getElementById("clearBtn").onclick = () => {
            this.tree.root = null;
            this.addHistory("Cleared All");
            this.render();
        };

        this.tree.onRotation = (msg)=>{
            document.getElementById("statRotation").innerText = msg;
        };
    }

    action(type){
        const input = document.getElementById("nodeValue");
        const val = parseInt(input.value);

        if(type !== "search" && isNaN(val)) return;

        if(type === "insert"){
            this.tree.root = this.tree.insert(this.tree.root, val);
            this.addHistory("Inserted " + val);
        }

        if(type === "delete"){
            this.tree.root = this.tree.delete(this.tree.root, val);
            this.addHistory("Deleted " + val);
        }

        if(type === "search"){
            this.addHistory("Searched " + val);
            setTimeout(()=>{
                const node = document.getElementById("node-"+val);
                if(node){
                    node.classList.add("searching");
                    setTimeout(()=>node.classList.remove("searching"),2000);
                }
            },50);
        }

        this.render();
        input.value = "";
    }

    save(){
        const inorder = this.tree.inorder(this.tree.root);
        localStorage.setItem("avlTree", JSON.stringify(inorder));
        alert("Tree Saved Successfully!");
    }

    load(){
        const data = JSON.parse(localStorage.getItem("avlTree") || "[]");
        this.tree.root = null;

        data.forEach(value => {
            this.tree.root = this.tree.insert(this.tree.root, value);
        });

        this.addHistory("Tree Restored");
        this.render();
    }

    exportPNG(){

    const svg = this.svg.cloneNode(true);

    //  FORCE STYLES INTO SVG (VERY IMPORTANT)
    svg.querySelectorAll("text").forEach(t=>{
        t.setAttribute("fill", "#000000");
        t.setAttribute("font-size", "16");
        t.setAttribute("font-family", "Arial");
        t.setAttribute("font-weight", "bold");
        t.setAttribute("text-anchor", "middle");
        t.setAttribute("dominant-baseline", "middle");
    });

    svg.querySelectorAll("circle").forEach(c=>{
        c.setAttribute("fill", "#1e293b");
        c.setAttribute("stroke", "#6366f1");
        c.setAttribute("stroke-width", "3");
    });

    svg.querySelectorAll("line").forEach(l=>{
        l.setAttribute("stroke", "#999999");
        l.setAttribute("stroke-width", "2");
    });

    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svg);

    // Namespace fix
    if(!source.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)){
        source = source.replace(/^<svg/,
            '<svg xmlns="http://www.w3.org/2000/svg"');
    }

    const svgBlob = new Blob([source], {type:"image/svg+xml;charset=utf-8"});
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();

    img.onload = () => {

        const canvas = document.createElement("canvas");

        canvas.width = 2000;
        canvas.height = 1200;

        const ctx = canvas.getContext("2d");

        // White background
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0,0,canvas.width,canvas.height);

        ctx.drawImage(img, 0, 0);

        URL.revokeObjectURL(url);

        const a = document.createElement("a");
        a.download = "avl-tree.png";
        a.href = canvas.toDataURL("image/png");
        a.click();
    };

    img.src = url;
}

    addHistory(text){
        const time = new Date().toLocaleTimeString();
        this.history.unshift(`[${time}] ${text}`);
        if(this.history.length > 20) this.history.pop();
        this.updateHistoryUI();
    }

    updateHistoryUI(){
        const container = document.getElementById("historyList");
        if(!container) return;

        if(this.history.length === 0){
            container.innerHTML = "No operations yet";
            return;
        }

        container.innerHTML = "";
        this.history.forEach(item=>{
            const div = document.createElement("div");
            div.className = "history-item";
            div.innerText = item;
            container.appendChild(div);
        });
    }

    render(){
        this.svg.innerHTML="";

        if(!this.tree.root){
            document.getElementById("statHeight").innerText=0;
            document.getElementById("statNodes").innerText=0;
            document.getElementById("inorder").innerText="[]";
            return;
        }

        const width = 1600;
        const height = 1000;

        this.svg.setAttribute("width",width);
        this.svg.setAttribute("height",height);

        const setPos=(node,x,y,offset)=>{
            if(!node) return;
            node.x=x; node.y=y;
            setPos(node.left,x-offset,y+100,offset/1.8);
            setPos(node.right,x+offset,y+100,offset/1.8);
        };

        setPos(this.tree.root,width/2,80,width/4);

        const draw=(node)=>{
            if(!node) return;

            if(node.left) this.drawLine(node,node.left);
            if(node.right) this.drawLine(node,node.right);

            this.drawNode(node);

            draw(node.left);
            draw(node.right);
        };

        draw(this.tree.root);

        document.getElementById("statHeight").innerText =
            this.tree.getHeight(this.tree.root);

        const inorder = this.tree.inorder(this.tree.root);

        document.getElementById("inorder").innerText =
            "["+inorder.join(", ")+"]";

        document.getElementById("statNodes").innerText =
            inorder.length;
    }

    drawNode(node){
        const g = document.createElementNS("http://www.w3.org/2000/svg","g");
        g.setAttribute("class","node");
        g.setAttribute("id","node-"+node.value);

        const c = document.createElementNS("http://www.w3.org/2000/svg","circle");
        c.setAttribute("cx",node.x);
        c.setAttribute("cy",node.y);
        c.setAttribute("r",25);

        const t = document.createElementNS("http://www.w3.org/2000/svg","text");
        t.setAttribute("x",node.x);
        t.setAttribute("y",node.y);
        t.textContent=node.value;

        const bf = document.createElementNS("http://www.w3.org/2000/svg","text");
        bf.setAttribute("x",node.x+30);
        bf.setAttribute("y",node.y-20);
        bf.setAttribute("class","node-bf");
        bf.textContent="BF: "+this.tree.getBalance(node);

        g.appendChild(c);
        g.appendChild(t);
        g.appendChild(bf);

        this.svg.appendChild(g);
    }

    drawLine(a,b){
        const line=document.createElementNS("http://www.w3.org/2000/svg","line");
        line.setAttribute("x1",a.x);
        line.setAttribute("y1",a.y);
        line.setAttribute("x2",b.x);
        line.setAttribute("y2",b.y);
        line.setAttribute("class","edge");
        this.svg.appendChild(line);
    }
}

window.onload = ()=> new App();