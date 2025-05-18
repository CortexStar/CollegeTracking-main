import 'package:flutter/material.dart';
import '../models/exam_model.dart';
import '../services/exam_database.dart';
import '../widgets/loading_page.dart';
import '../widgets/frame_animation.dart';
import './add_exam_page.dart';
import '../widgets/exam_card.dart';

class ExamPage extends StatefulWidget {
  const ExamPage({super.key});

  @override
  State<ExamPage> createState() => _ExamPageState();
}

class _ExamPageState extends State<ExamPage> {
  late Future<List<Exam>> _examsFuture;
  final ExamDatabase _examDatabase = ExamDatabase();
  bool _isInitialLoad = true;

  @override
  void initState() {
    super.initState();
    _examsFuture = _examDatabase.getExams();
  }

  Future<void> _loadExams() async {
    setState(() {
      _isInitialLoad = false;
      _examsFuture = _examDatabase.getExams();
    });
  }

  Future<void> _deleteExam(int id) async {
    await _examDatabase.deleteExam(id);
    _loadExams();
  }

  void _navigateToAddExamPage() async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => const AddExamPage()),
    );
    if (result == true && mounted) {
      _loadExams();
    }
  }

  void _navigateToEditExamPage(Exam exam) async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => AddExamPage(exam: exam)),
    );
    if (result == true && mounted) {
      _loadExams();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Exams'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: _navigateToAddExamPage,
            tooltip: 'Add Exam',
          ),
        ],
      ),
      body: FutureBuilder<List<Exam>>(
        future: _examsFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const LoadingPage();
          } else if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          } else if (snapshot.hasData) {
            final exams = snapshot.data!;
            if (exams.isEmpty) {
              return Container();
            }
            
            // Only wrap with FrameAnimation if it's not the initial load
            final listView = ListView.builder(
              itemCount: exams.length,
              itemBuilder: (context, index) {
                final exam = exams[index];
                return ExamCard(
                  exam: exam,
                  onDelete: () => _deleteExam(exam.id!),
                  onEdit: () => _navigateToEditExamPage(exam),
                );
              },
            );

            return _isInitialLoad ? listView : FrameAnimation(child: listView);
          }
          return const LoadingPage();
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _navigateToAddExamPage,
        child: const Icon(Icons.add),
        tooltip: 'Add Exam',
      ),
    );
  }
} 