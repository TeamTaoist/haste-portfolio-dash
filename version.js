
import fs from "fs";
import PackageJson from "./package.json" assert { type: "json" };

const ver = new Date().valueOf();
const COMMIT_REF = process.env.COMMIT_REF;

const functionStr = `export default function Version(){
  


    return <div className="version"><span>V${PackageJson.version}.{'${COMMIT_REF}'?.slice(0,7)}</span>  </div>

}`;

fs.writeFile("./src/version.tsx", functionStr, (err, data) => {
    if (err) throw err;
    console.log(data);
});

// const data = fs.readFileSync('./src/app.js', 'utf8').split('\n')
// data.splice(0, 0, 'import Version from "./version";')
// fs.writeFileSync('./src/app.js', data.join('\n'), 'utf8')
