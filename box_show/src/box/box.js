import React from "react";

const IssuesAndTodos = () => {
  // 打开 GitHub 链接
  const openGitHub = () => {
    window.open("https://github.com/L1TangDingZhen/BOX_P", "_blank");
  };

  // 跳转到 /back 路径
  const goToBack = () => {
    window.location.href = "/back";
  };

  // 跳转到 /back 路径
  const goToTwo = () => {
    window.location.href = "/two";
  };

  // 跳转到 /back 路径
  const goToThr = () => {
    window.location.href = "/thr";
  };

  // 跳转到 /back 路径
  const goToFou = () => {
    window.location.href = "/fou";
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>问题和代办列表</h1>

      {/* 按钮组 */}
      <div style={styles.buttonGroup}>
        <button style={styles.button} onClick={openGitHub}>
          访问 GitHub 仓库
        </button>
        <button style={styles.button} onClick={goToBack}>
          访问 /back 链接
        </button>
        <button style={styles.button} onClick={goToTwo}>
          访问 /two 
        </button>
        <button style={styles.button} onClick={goToThr}>
          访问 /thr 
        </button>
        <button style={styles.button} onClick={goToFou}>
          访问 /fou 
        </button>
      </div>

      {/* 问题列表 */}
      <div style={styles.section}>
        <h2 style={styles.subHeader}>问题</h2>
        <ul style={styles.list}>
          <li style={styles.strikethrough}>x, y, z 定义问题</li>
          <li style={styles.strikethrough}>后端是否返回起始坐标</li>
          <li style={styles.strikethrough}>是否设置起始空间大小</li>
          <li style={styles.strikethrough}>移动端无法全屏</li>
          <li style={styles.strikethrough}>全屏按钮需要优化位置</li>
          <li style={styles.strikethrough}>长方体尺寸有验证是否冲突，！但起始位置没有验证（没有验证加入长方体后位置是否超出空间大小</li>
          <li>超大数值会卡住</li>
          <li style={styles.strikethrough}>iPad退出全屏没有问题 iPhone无法退出全屏</li>
          <li style={styles.strikethrough}>iPad退出当前页面和正常向下晃动混淆</li>
          <li style={styles.strikethrough}>页面缩略图在全屏后大小有变化</li>
          <li style={styles.strikethrough}>超大数值保护的问题</li>
          <li style={styles.strikethrough}>input records 可以删除修改的问题</li>
          <li style={styles.strikethrough}>在free view的模式下，摄像头缩小后只能看到大概40左右的刻度，无法缩小到可以看到整个坐标系</li>
          <li style={styles.strikethrough}>页面缩略图在全屏后大小有变化</li>

        </ul>
      </div>

      <div style={styles.section}>
        <h2 style={styles.subHeader}>待商讨</h2>
        <ul style={styles.list}>
          <li style={styles.strikethrough}>空间的xyz是否取最大值当作数值或者任由输入</li>
          <li>已存在的模型下重新设置空间尺寸情况</li>
          <li>在设置新的空间尺寸后，摄像机的角度是归零还是保持原有角度</li>
          <li>三视图切换后，视角会错乱</li>
          <li>先设置长方体尺寸后，再设置空间尺寸没有设置检测机制</li>
        </ul>
      </div>

      {/* 代办事项列表 */}
      <div style={styles.section}>
        <h2 style={styles.subHeader}>代办</h2>
        <ul style={styles.list}>
          <li style={styles.strikethrough}>用作分层的进度条</li>
          <li style={styles.strikethrough}>拖拽？</li>
          <li style={styles.strikethrough}>前一个物体变为灰色</li>
          <li style={styles.strikethrough}>三视图角度</li>
          <li style={styles.strikethrough}>物理的放置顺序和列表</li>
          <li style={styles.strikethrough}>是否两个进度条，一个用作排放顺序，一个用作层数控制</li>
        </ul>
      </div>



      {/* bug */}
      <div style={styles.section}>
        <h2 style={styles.subHeader}>bug to fixed</h2>
        <ul style={styles.list}>
          <li style={styles.strikethrough}>页面缩略图在全屏后大小有变化</li>
          <li style={styles.strikethrough}>三视图角度</li>
          <li style={styles.strikethrough}>自定义修改空间尺寸后，在未全屏的状态下，无法转动视角</li>

          <li style={styles.strikethrough}>用作分层的进度条</li>
          <li style={styles.strikethrough}>物理的放置顺序和列表</li>
          <li style={styles.strikethrough}>是否两个进度条，一个用作排放顺序，一个用作层数控制</li>
          <li style={styles.strikethrough}>前一个物体变为灰色</li>
          <li style={styles.strikethrough}>iPhone和iPad无法向下滑动退出全屏状态</li>
          <li>超大数值会卡住</li>
          <li>标签的长度是取最大值</li>
          <li>先设置长方体尺寸后，再设置空间尺寸没有设置检测机制</li>
          <li style={styles.strikethrough}>非全屏状态下，全屏并推出摄像头偏移问题，未居中</li>
          <li style={styles.strikethrough}>全屏状态下按钮依旧不可见</li>

        </ul>
      </div>
    </div>
  );
};

// 样式
const styles = {
  container: {
    maxWidth: "800px",
    margin: "50px auto",
    padding: "20px",
    backgroundColor: "#f9f9f9",
    borderRadius: "8px",
    boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
    fontFamily: "Arial, sans-serif",
    color: "#333",
  },
  header: {
    textAlign: "center",
    color: "#0078d4",
  },
  buttonGroup: {
    display: "flex",
    justifyContent: "center",
    gap: "20px",
    marginBottom: "20px",
  },
  button: {
    padding: "10px 20px",
    fontSize: "16px",
    backgroundColor: "#0078d4",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  section: {
    marginTop: "20px",
  },
  subHeader: {
    color: "#444",
  },
  list: {
    listStyle: "square",
    marginLeft: "20px",
  },
  // 添加 strikethrough 样式
  strikethrough: {
    textDecoration: "line-through",
  },
};


export default IssuesAndTodos;



// 全屏后再次退出，缩略图的坐标系不居中


// 全屏按钮在全屏状态下还是不存在


// two和thr发给，让他修改旧的
// 旧的可以用，就是两个问题