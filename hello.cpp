// hello.cpp
// 经典 C++ Hello World 程序：验证编译与运行流程
// 编译：g++ -std=c++17 -Wall hello.cpp -o hello
// 运行：./hello

#include <iostream>   // 引入标准输入输出流，提供 std::cout 与 std::endl

int main()            // 程序入口，返回 int 表示退出状态
{
    std::cout << "Hello, World!" << std::endl;  // 向标准输出打印一行文本
    return 0;         // 返回 0，表示程序正常结束
}
